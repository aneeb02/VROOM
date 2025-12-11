import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { loadTensorflowModel } from '../services/TfliteWrapper';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import jpeg from 'jpeg-js';


const TireAnalysisScreen = () => {
  const [image, setImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const modelRef = useRef(null);

  // Load the model on component mount
  React.useEffect(() => {
    const loadModel = async () => {
      try {
        setIsLoading(true);
        const model = await loadTensorflowModel(
          require('../../assets/models/tyre_quality_modelEN.tflite'),
          'default'
        );
        modelRef.current = model;
        console.log('Model loaded successfully');
        console.log('Model inputs:', model.inputs);
        console.log('Model outputs:', model.outputs);
      } catch (e) {
        console.error('Failed to load model:', e);
        setError('Failed to load tire analysis model. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadModel();
  }, []);

  // Pick image from camera or library
  const pickImage = async (source = 'library') => {
    try {
      setError(null);
      let result;

      if (source === 'camera') {
        const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
        if (!cameraPermission.granted) {
          Alert.alert('Camera Permission', 'We need camera access to take photos.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 1,
        });
      } else {
        const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!libraryPermission.granted) {
          Alert.alert('Library Permission', 'We need access to your photo library.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 1,
        });
      }

      if (!result.canceled) {
        setImage(result.assets[0].uri);
        setAnalysisResult(null);
      }
    } catch (error) {
      setError('Error selecting image: ' + error.message);
    }
  };

  // Convert image to TypedArray for model inference
  const imageToArray = async (imageUri) => {
    try {
      // Get image dimensions to know expected size
      const manipResult = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 224, height: 224 } }],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Read the image as base64
      const base64 = await FileSystem.readAsStringAsync(manipResult.uri, {
        encoding: 'base64',
      });

      // Convert Base64 string to Uint8Array
      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const rawImageData = jpeg.decode(bytes, { useTArray: true }); // returns { width, height, data }

      // For now, we'll use a placeholder implementation
      // In production, you'd fetch the base64 and convert to pixel array
      // This depends on your model's exact input requirements
      const pixelArray = new Float32Array(224 * 224 * 3);

      // Fill with normalized pixel values (-1.0 to 1.0 range)
      // jpeg-js returns RGBA (4 bytes per pixel)
      // We need RGB (3 floats per pixel)
      const { data } = rawImageData;
      let pixelIndex = 0;

      for (let i = 0; i < data.length; i += 4) {
       
        pixelArray[pixelIndex] = data[i] / 255.0;     // R
        pixelArray[pixelIndex + 1] = data[i + 1] / 255.0; // G
        pixelArray[pixelIndex + 2] = data[i + 2] / 255.0; // B
        
        pixelIndex += 3;
      }

      return pixelArray;
    } catch (error) {
      throw new Error('Failed to process image: ' + error.message);
    }
  };

  // Run model inference
  const analyzeImage = async () => {
    if (!image) {
      setError('Please select an image first');
      return;
    }

    if (!modelRef.current) {
      setError('Model not loaded. Please wait and try again.');
      return;
    }

    try {
      setIsAnalyzing(true);
      setError(null);

      // Convert image to array
      const inputArray = await imageToArray(image);

      console.log("Input Array Length:", inputArray.length);
      console.log("First 10 pixels (R,G,B...):", inputArray.slice(0, 10));

      // Run inference
      const outputs = await modelRef.current.run([inputArray]);
      
      console.log("Raw Output:", outputs);
      
      const resultData = outputs[0];
      const goodProbability = resultData[0]; 
      
      const threshold = 0.7;
      const quality = goodProbability >= threshold ? 'good' : 'poor';

      // FIX: Create only binary scores for the UI visualization
      const confidence = quality === 'good' ? goodProbability : 1 - goodProbability;
      
      const qualityScores = {
        good: goodProbability,
        poor: 1 - goodProbability,
      };

      setAnalysisResult({
        quality,
        scores: qualityScores,
        confidence: confidence, 
      });
    } catch (error) {
      console.error('Analysis failed:', error);
      setError('Tire analysis failed: ' + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Get quality color and recommendation
  const getQualityColor = (quality) => {
    switch (quality) {
      case 'good':
        return '#4CAF50';
      case 'poor':
        return '#f44336';
      default:
        return '#999';
    }
  };

  const getRecommendation = (quality) => {
    switch (quality) {
      case 'good':
        return 'Your tire is in good condition. No immediate action is required.';
      case 'poor':
        return 'Your tire requires immediate attention. Replacement may be needed.';
      default:
        return '';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="car" size={32} color="#FFC107" />
        <Text style={styles.headerText}>Tire Analysis</Text>
      </View>

      {/* Loading Model */}
      {isLoading && (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#FFC107" />
          <Text style={styles.loadingText}>Loading tire analysis model...</Text>
        </View>
      )}

      {/* Error Message */}
      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={20} color="#f44336" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Image Display */}
      {image && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: image }} style={styles.image} />
          <TouchableOpacity
            style={styles.removeImageBtn}
            onPress={() => {
              setImage(null);
              setAnalysisResult(null);
            }}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Action Buttons */}
      {!isLoading && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cameraBtn]}
            onPress={() => pickImage('camera')}
            disabled={isAnalyzing}
          >
            <Ionicons name="camera" size={20} color="#fff" />
            <Text style={styles.buttonText}>Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.libraryBtn]}
            onPress={() => pickImage('library')}
            disabled={isAnalyzing}
          >
            <Ionicons name="images" size={20} color="#fff" />
            <Text style={styles.buttonText}>Choose Photo</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Analyze Button */}
      {image && !isLoading && (
        <TouchableOpacity
          style={[
            styles.analyzeBtn,
            isAnalyzing && styles.analyzeBtnDisabled,
          ]}
          onPress={analyzeImage}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <ActivityIndicator size="small" color="#1a1a1a" />
              <Text style={styles.analyzeBtnText}>Analyzing...</Text>
            </>
          ) : (
            <>
              <Ionicons name="analytics" size={20} color="#1a1a1a" />
              <Text style={styles.analyzeBtnText}>Analyze Tire</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Analysis Results */}
      {analysisResult && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Analysis Results</Text>

          {/* Quality Indicator */}
          <View
            style={[
              styles.qualityBox,
              {
                borderLeftColor: getQualityColor(analysisResult.quality),
              },
            ]}
          >
            <Text style={styles.qualityLabel}>Tire Quality</Text>
            <Text
              style={[
                styles.qualityValue,
                { color: getQualityColor(analysisResult.quality) },
              ]}
            >
              {analysisResult.quality.toUpperCase()}
            </Text>
            <Text style={styles.confidenceText}>
              Confidence: {(analysisResult.confidence * 100).toFixed(1)}%
            </Text>
          </View>

          {/* Scores Breakdown */}
          <View style={styles.scoresContainer}>
            <Text style={styles.scoresTitle}>Quality Scores</Text>
            {/* The Object.entries here will now only iterate over 'good' and 'poor' */}
            {Object.entries(analysisResult.scores).map(([key, value]) => (
              <View key={key} style={styles.scoreItem}>
                <Text style={styles.scoreLabel}>
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </Text>
                <View style={styles.scoreBarContainer}>
                  <View
                    style={[
                      styles.scoreBar,
                      {
                        width: `${(value * 100).toFixed(0)}%`,
                        backgroundColor: getQualityColor(key),
                      },
                    ]}
                  />
                </View>
                <Text style={styles.scoreValue}>
                  {(value * 100).toFixed(1)}%
                </Text>
              </View>
            ))}
          </View>

          {/* Recommendation */}
          <View style={styles.recommendationBox}>
            <Ionicons name="bulb" size={20} color="#FFC107" />
            <Text style={styles.recommendationText}>
              {getRecommendation(analysisResult.quality)}
            </Text>
          </View>

          {/* New Analysis Button */}
          <TouchableOpacity
            style={styles.newAnalysisBtn}
            onPress={() => {
              setImage(null);
              setAnalysisResult(null);
            }}
          >
            <Text style={styles.newAnalysisBtnText}>Analyze Another Tire</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Initial Help Text */}
      {!image && !analysisResult && !isLoading && (
        <View style={styles.helpContainer}>
          <Ionicons name="information-circle" size={32} color="#FFC107" />
          <Text style={styles.helpText}>
            Capture or upload a clear photo of your tire to analyze its condition
          </Text>
          <Text style={styles.helpSubtext}>
            Ensure good lighting and that the entire tire is visible in the frame
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617', // Updated background
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  headerText: {
    fontSize: 28,
    color: '#fff',
    marginLeft: 12,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  errorBox: {
    backgroundColor: '#ffebee',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    color: '#c62828',
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  imageContainer: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 12,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  cameraBtn: {
    backgroundColor: '#2196F3',
  },
  libraryBtn: {
    backgroundColor: '#9C27B0',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  analyzeBtn: {
    backgroundColor: '#FACC15',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 20,
    gap: 8,
  },
  analyzeBtnDisabled: {
    opacity: 0.6,
  },
  analyzeBtnText: {
    color: '#020617',
    fontSize: 16,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  resultsContainer: {
    marginTop: 12,
    marginBottom: 32,
  },
  resultsTitle: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 16,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  qualityBox: {
    backgroundColor: '#111827', // Updated box bg
    borderRadius: 8,
    borderLeftWidth: 4,
    padding: 16,
    marginBottom: 16,
  },
  qualityLabel: {
    color: '#9ca3af',
    fontSize: 12,
    marginBottom: 4,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  qualityValue: {
    fontSize: 28,
    marginBottom: 8,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  confidenceText: {
    color: '#9ca3af',
    fontSize: 12,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  scoresContainer: {
    backgroundColor: '#111827', // Updated box bg
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  scoresTitle: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 12,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  scoreItem: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scoreLabel: {
    color: '#9ca3af',
    fontSize: 12,
    width: 50,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  scoreBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: '#1f2937', // Updated bar bg
    borderRadius: 3,
    overflow: 'hidden',
  },
  scoreBar: {
    height: '100%',
    borderRadius: 3,
  },
  scoreValue: {
    color: '#fff',
    fontSize: 12,
    width: 50,
    textAlign: 'right',
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  recommendationBox: {
    backgroundColor: 'rgba(250, 204, 21, 0.1)', // Yellow tint
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    gap: 12,
  },
  recommendationText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  newAnalysisBtn: {
    backgroundColor: '#2196F3',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  newAnalysisBtnText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  helpContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  helpText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  helpSubtext: {
    color: '#9ca3af',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 12,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
});

export default TireAnalysisScreen;