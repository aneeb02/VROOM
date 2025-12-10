import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import { shareAsync } from "expo-sharing";

// TODO: replace with your own backend URL
const API_BASE_URL = "https://lavina-oilfired-possessively.ngrok-free.dev";

function DTCDetailScreen({ route, navigation }) {
  const { code, description } = route.params || { code: "P0420", description: "" };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [redditSources, setRedditSources] = useState([]);

  useEffect(() => {
    const fetchDiagnosis = async () => {
      try {
        setLoading(true);
        setError(null);

        const body = {
          dtc: code,
          vehicle: {
            make: "Unknown",
            model: "Unknown",
            year: 0,
            pid_snapshot: {},
          },
        };

        const res = await fetch(`${API_BASE_URL}/AI_diagnosis/dtc_diagnose`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) throw new Error("Backend error: " + res.status);

        const json = await res.json();
        console.log("AI diagnosis response:", json);

        const first = json?.results?.[0] || null;
        setResult(first);

        const rawSources = json?.reddit_sources || [];
        const seen = new Set();
        const unique = [];

        for (const src of rawSources) {
          const key = src.url || src.title;
          if (!key) continue;
          if (seen.has(key)) continue;
          seen.add(key);
          unique.push(src);
        }

        setRedditSources(unique);
      } catch (e) {
        console.log("Error fetching diagnosis", e);
        setError(e.message || "Failed to fetch diagnosis");
      } finally {
        setLoading(false);
      }
    };

    fetchDiagnosis();
  }, [code]);

  const severityLabel = result?.severity || "UNKNOWN";

  const handleOpenLink = (url) => {
    if (!url) return;
    Linking.openURL(url).catch((err) => console.log("Failed to open URL", err));
  };

  const handleExportPdf = async () => {
    try {
      if (!result) {
        Alert.alert("No report", "There is no diagnosis data to export yet.");
        return;
      }

      const html = `
        <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; padding: 24px; color: #111827; }
            h1 { font-size: 24px; margin-bottom: 4px; }
            h2 { font-size: 18px; margin-top: 20px; margin-bottom: 8px; }
            .badge { display:inline-block; padding:4px 10px; border-radius:999px; background:#FACC15; font-weight:600; font-size:12px; }
            ul { padding-left:20px; }
            li { margin-bottom:4px; }
            .section { margin-top: 16px; }
            .meta { color:#6B7280; font-size: 12px; margin-bottom: 16px; }
          </style>
        </head>
        <body>
          <h1>${result.dtc_code || code}</h1>
          <div class="meta">${result.dtc_meaning || ""}</div>

          <div class="section">
            <span class="badge">Severity: ${result.severity || "UNKNOWN"}</span>
          </div>

          <div class="section">
            <h2>Summary</h2>
            <p>${result.summary}</p>
          </div>

          ${
            Array.isArray(result.causes) && result.causes.length
              ? `<div class="section">
                  <h2>Possible Causes</h2>
                  <ul>${result.causes.map((c) => `<li>${c}</li>`).join("")}</ul>
                </div>`
              : ""
          }

          ${
            Array.isArray(result.effects) && result.effects.length
              ? `<div class="section">
                  <h2>Effects / Symptoms</h2>
                  <ul>${result.effects.map((e) => `<li>${e}</li>`).join("")}</ul>
                </div>`
              : ""
          }

          ${
            Array.isArray(result.quick_fixes) && result.quick_fixes.length
              ? `<div class="section">
                  <h2>Actionable Advice</h2>
                  <ul>${result.quick_fixes.map((q) => `<li>${q}</li>`).join("")}</ul>
                </div>`
              : ""
          }

          ${
            result.safety_advice
              ? `<div class="section">
                  <h2>Safety Advice</h2>
                  <p>${result.safety_advice}</p>
                </div>`
              : ""
          }
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      console.log("PDF created at:", uri);

      await shareAsync(uri, {
        mimeType: "application/pdf",
        UTI: "com.adobe.pdf",
        dialogTitle: "Save or share diagnosis report",
      });
    } catch (err) {
      console.error("PDF export failed:", err);
      Alert.alert("Error", "Could not generate the PDF report.");
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCodeBlock}>
            <Text style={styles.code}>{result?.dtc_code || code}</Text>
            <Text style={styles.chipSystem}>Engine / Powertrain</Text>
          </View>
        </View>

        <Text style={styles.title}>
          {result?.dtc_meaning || description || "Diagnostic Trouble Code"}
        </Text>
        <Text style={styles.subtitle}>Summary</Text>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#FFC107" size="large" />
          <Text style={styles.loadingText}>Analyzing code…</Text>
        </View>
      )}

      {error && !loading && (
        <View style={styles.sectionCard}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="warning-outline" size={20} color="#fca5a5" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        </View>
      )}

      {!loading && !error && result && (
        <>
          {/* Severity + summary */}
          <View style={styles.sectionCard}>
            <View style={styles.severityRow}>
              <Text style={styles.sectionLabel}>Severity</Text>
              <View
                style={[
                  styles.severityPill,
                  (severityLabel === "HIGH" || severityLabel === "CRITICAL") &&
                    styles.severityPillHigh,
                ]}
              >
                <Ionicons
                  name={
                    severityLabel === "HIGH" || severityLabel === "CRITICAL"
                      ? "alert-circle"
                      : "information-circle"
                  }
                  size={14}
                  color="#000"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.severityText}>{severityLabel}</Text>
              </View>
            </View>
            <Text style={styles.description}>{result.summary}</Text>
          </View>

          {/* Causes */}
          {Array.isArray(result.causes) && result.causes.length > 0 && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Possible Causes</Text>
              {result.causes.map((c, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.description}>{c}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Effects */}
          {Array.isArray(result.effects) && result.effects.length > 0 && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Effects / Symptoms</Text>
              {result.effects.map((e, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.description}>{e}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Quick fixes */}
          {Array.isArray(result.quick_fixes) && result.quick_fixes.length > 0 && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Actionable Advice</Text>
              {result.quick_fixes.map((text, index) => (
                <View key={index} style={styles.adviceItem}>
                  <View style={styles.adviceIcon}>
                    <Ionicons name="checkmark" size={18} color="#22c55e" />
                  </View>
                  <Text style={styles.adviceText}>{text}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Safety advice */}
          {result.safety_advice ? (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Safety Advice</Text>
              <Text style={styles.description}>{result.safety_advice}</Text>
            </View>
          ) : null}

          {/* Reddit sources */}
          {Array.isArray(redditSources) && redditSources.length > 0 && (
            <View style={styles.sectionCard}>
              <View style={styles.redditHeaderRow}>
                <Ionicons name="logo-reddit" size={20} color="#f97316" />
                <Text style={styles.sectionTitle}>Based on community discussions</Text>
              </View>

              {redditSources.map((src, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.redditItem}
                  onPress={() => handleOpenLink(src.url)}
                >
                  <Ionicons
                    name="open-outline"
                    size={16}
                    color="#93C5FD"
                    style={styles.redditIcon}
                  />
                  <Text style={styles.redditLink} numberOfLines={2}>
                    {src.title || src.url} {src.subreddit ? `(${src.subreddit})` : ""}
                  </Text>
                </TouchableOpacity>
              ))}

              <Text style={styles.redditHint}>
                These links were used as extra context. Tap to open them in your browser for more
                details.
              </Text>
            </View>
          )}
        </>
      )}

      {/* Footer buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.buttonSecondary} onPress={handleExportPdf}>
          <Ionicons name="document-outline" size={16} color="#fff" />
          <Text style={styles.buttonSecondaryText}>Export as PDF</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buttonPrimary}
          onPress={() => navigation.navigate("Assistant", {
    screen: "AssistantHome",
  })}  
        >
          <Ionicons name="chatbubbles-outline" size={16} color="#000" />
          <Text style={styles.buttonPrimaryText}>Talk to Ustaad</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

export default DTCDetailScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#020617" },

  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#111827",
    backgroundColor: "#020617",
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#111827",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerCodeBlock: {
    flexDirection: "column",
  },
  chipSystem: {
    alignSelf: "flex-start",
    marginTop: 4,
    backgroundColor: "#020617",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 11,
    color: "#9CA3AF",
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  code: {
    fontSize: 24,
    fontWeight: "800",
    color: "#F9FAFB",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#e5e7eb",
  },

  sectionCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: "#111827",
  },
  sectionLabel: {
    fontSize: 13,
    color: "#9CA3AF",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F9FAFB",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#D1D5DB",
    lineHeight: 22,
    marginTop: 4,
  },

  severityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  severityPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FACC15",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  severityPillHigh: {
    backgroundColor: "#FB923C",
  },
  severityText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#000",
  },

  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 4,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FACC15",
    marginTop: 8,
    marginRight: 8,
  },

  adviceItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  adviceIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: "#15803d",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  adviceText: {
    fontSize: 14,
    color: "#E5E7EB",
    flex: 1,
  },

  redditHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  redditItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 4,
  },
  redditIcon: {
    marginRight: 6,
    marginTop: 2,
  },
  redditLink: {
    color: "#93C5FD",
    fontSize: 13,
    flex: 1,
  },
  redditHint: {
    color: "#6B7280",
    fontSize: 11,
    marginTop: 10,
  },

  buttonContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  buttonSecondary: {
    flex: 1,
    backgroundColor: "#020617",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#4b5563",
  },
  buttonSecondaryText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 6,
  },
  buttonPrimary: {
    flex: 1,
    backgroundColor: "#FACC15",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  buttonPrimaryText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 14,
    marginLeft: 6,
  },

  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 8,
    color: "#ccc",
  },
  errorText: {
    color: "#fca5a5",
    fontSize: 14,
    marginLeft: 8,
  },
});
