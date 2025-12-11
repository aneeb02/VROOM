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

const API_BASE_URL = "https://lavina-oilfired-possessively.ngrok-free.dev";

export default function DTCDetailScreen({ route, navigation }) {
  const { code, description } = route.params || {
    code: "P0420",
    description: "",
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [redditSources, setRedditSources] = useState([]);
  const [catalogueLinks, setCatalogueLinks] = useState([]); 

  // Helper to safely render quick fixes (supports string or object)
  const renderQuickFixText = (item) => {
    if (typeof item === "string") return item;

    if (item && typeof item === "object") {
      // try common shapes we might return from LLM
      if (item.step && item.location_tip) {
        return `${item.step} — ${item.location_tip}`;
      }
      if (item.step) return item.step;
      if (item.action) return item.action;
      if (item.tip) return item.tip;
      try {
        return JSON.stringify(item);
      } catch {
        return String(item);
      }
    }

    return String(item ?? "");
  };

  useEffect(() => {
    const fetchDiagnosis = async () => {
      try {
        setLoading(true);
        setError(null);

        const body = {
          dtc: code,
          vehicle: {
            make: "Toyota",
            model: "Corolla",
            year: 2018,
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

        // DEDUPE REDDIT SOURCES BY URL OR TITLE
        const rawSources = json?.reddit_sources || [];
        const seen = new Set();
        const unique = [];

        for (const src of rawSources) {
          const key = src.url || src.title;
          if (!key) continue;
          if (seen.has(key)) continue;
          unique.push(src);
        }
        setRedditSources(unique);
        
        let cat = json?.dtc_catalogue_links ;

        if (Array.isArray(cat)) {
          const cleaned = cat
            .filter(Boolean)
            .map((item) => {
              if (typeof item === "string") {
                return { url: item, title: item };
              }
              if (item && typeof item === "object") {
                return {
                  url: item.url || item.href || "",
                  title: item.title || item.text || item.url || item.href || "",
                };
              }
              return null;
            })
            .filter((x) => x && x.url);
          setCatalogueLinks(cleaned);
        } else if (typeof cat === "string" && cat.trim()) {
          // single URL string
          setCatalogueLinks([{ url: cat.trim(), title: "View forum discussion" }]);
        } else {
          setCatalogueLinks([]);
        }
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
    Linking.openURL(url).catch((err) =>
      console.log("Failed to open URL", err)
    );
  };

  const handleExportPdf = async () => {
    try {
      if (!result) {
        Alert.alert(
          "No report",
          "There is no diagnosis data to export yet."
        );
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
                 <ul>${result.causes
                   .map((c) => `<li>${renderQuickFixText(c)}</li>`)
                   .join("")}</ul>
               </div>`
            : ""
        }

        ${
          Array.isArray(result.effects) && result.effects.length
            ? `<div class="section">
                 <h2>Effects / Symptoms</h2>
                 <ul>${result.effects
                   .map((e) => `<li>${renderQuickFixText(e)}</li>`)
                   .join("")}</ul>
               </div>`
            : ""
        }

        ${
          Array.isArray(result.quick_fixes) && result.quick_fixes.length
            ? `<div class="section">
                 <h2>Actionable Advice</h2>
                 <ul>${result.quick_fixes
                   .map((q) => `<li>${renderQuickFixText(q)}</li>`)
                   .join("")}</ul>
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* Back Button + Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
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
          {/* Severity + Summary */}
          <View style={styles.sectionCard}>
            <View style={styles.severityRow}>
              <Text style={styles.sectionLabel}>Severity</Text>
              
              <View
                style={[
                  styles.severityPill,
                  (severityLabel === "HIGH" ||
                    severityLabel === "CRITICAL") &&
                    styles.severityPillHigh,
                ]}
              >
                <Ionicons
                  name={
                    severityLabel === "HIGH" ||
                    severityLabel === "CRITICAL"
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
            <Text style={styles.sectionTitle}>What does this code mean?</Text>
            <Text style={styles.description}>{result.summary}</Text>
          </View>

          {/* Causes */}
          
         {Array.isArray(result.causes) && result.causes.length > 0 && (
  <View style={styles.sectionCard}>
    <Text style={styles.sectionTitle}>Possible Causes</Text>

    {result.causes.map((c, idx) => (
      <View key={idx} style={styles.causeCard}>
        <View style={styles.causeIconCircle}>
          <Ionicons name="warning-outline" size={18} color="#fb923c" />
        </View>

        <View style={styles.causeTextWrapper}>
          <Text style={styles.causeLabel}>Cause {idx + 1}</Text>
          <Text style={styles.causeText}>{c}</Text>
        </View>
      </View>
    ))}
  </View>
)}



         {Array.isArray(result.effects) && result.effects.length > 0 && (
  <View style={styles.sectionCard}>
    <Text style={styles.sectionTitle}>Effects / Symptoms</Text>

    {result.effects.map((e, idx) => (
      <View key={idx} style={styles.effectCard}>
        <View style={styles.effectIconCircle}>
          <Ionicons name="pulse-outline" size={18} color="#38bdf8" />
        </View>

        <View style={styles.effectTextWrapper}>
          <Text style={styles.effectLabel}>Symptom {idx + 1}</Text>
          <Text style={styles.effectText}>{e}</Text>
        </View>
      </View>
    ))}
  </View>
)}


          
          {/* Quick fixes - variant 1 (Action + Location) */}
          {Array.isArray(result.quick_fixes) && result.quick_fixes.length > 0 && (
  <View style={styles.sectionCard}>
    <Text style={styles.sectionTitle}>Actionable Advice</Text>

    {result.quick_fixes.map((item, index) => {
      const isObject = item && typeof item === "object";
      const step = isObject ? item.step : item;
      const locationTip = isObject ? item.location_tip : null;

      if (!step) return null;

      return (
        <View key={index} style={styles.actionCard}>
          <View style={styles.actionHeader}>
            <View style={styles.checkIconBox}>
              <Ionicons name="checkmark" size={18} color="#22c55e" />
            </View>

            <Text style={styles.actionLabel}>ACTION</Text>
          </View>

          <Text style={styles.actionStep}>{step}</Text>

          {locationTip && (
            <>
              <View style={styles.locationHeader}>
                <Ionicons name="location-outline" size={16} color="#38bdf8" />
                <Text style={styles.locationLabel}>Where to find it</Text>
              </View>

              <Text style={styles.locationText}>{locationTip}</Text>
            </>
          )}
        </View>
      );
    })}
  </View>
)}
          {result.technical_terms && (
  <View style={styles.sectionCard}>
    <View style={styles.techHeaderRow}>
      <View style={styles.techIconCircle}>
        <Ionicons name="help-outline" size={16} color="#38bdf8" />
      </View>
      <Text style={styles.sectionTitle}>Technical Terms Explained</Text>
    </View>

    {Object.entries(result.technical_terms).map(([term, desc]) => (
      <View key={term} style={styles.techTermRow}>
        <View style={styles.techTermChip}>
          <Text style={styles.techTermName}>{term}</Text>
        </View>
        <Text style={styles.techTermDescription}>{desc}</Text>
      </View>
    ))}
  </View>
)}

          {/* Safety advice */}
          {result.safety_advice ? (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Safety Advice</Text>
              <Text style={styles.description}>{result.safety_advice}</Text>
              <Text style={{ marginTop: 8, fontSize: 11, color: "red" }}>
  Important: This AI-generated diagnosis is based on public online discussions and reference data. It is not professional repair advice, may be incomplete or incorrect for your specific vehicle, and should not be used as the sole basis for repairs. Always have a qualified mechanic inspect and repair your vehicle.
</Text>

            </View>
          ) : null}
          

          {/* Catalogue forum links (from DTC catalogue discussion column) */}
          {Array.isArray(catalogueLinks) && catalogueLinks.length > 0 && (
            <View style={styles.sectionCard}>
              <View style={styles.redditHeaderRow}>
                <Ionicons
                  name="globe-outline"
                  size={20}
                  color="#38bdf8"
                />
                <Text style={styles.sectionTitle}>
                  Refer to the following forum links
                </Text>
              </View>

              {catalogueLinks.map((link, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.redditItem}
                  onPress={() => handleOpenLink(link.url)}
                >
                  <Ionicons
                    name="open-outline"
                    size={16}
                    color="#93C5FD"
                    style={styles.redditIcon}
                  />
                  <Text style={styles.redditLink} numberOfLines={2}>
                    {link.title || link.url}
                  </Text>
                </TouchableOpacity>
              ))}

              <Text style={styles.redditHint}>
                These links come from the DTC catalogue discussion column. Tap
                to open them in your browser for detailed discussions on the DTC.
              </Text>
            </View>
          )}

          {/* Reddit sources */}
          {Array.isArray(redditSources) && redditSources.length > 0 && (
            <View style={styles.sectionCard}>
              <View style={styles.redditHeaderRow}>
                <Ionicons name="logo-reddit" size={20} color="#f97316" />
                <Text style={styles.sectionTitle}>
                  Based on community discussions
                </Text>
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
                    {src.title || src.url}{" "}
                    {src.subreddit ? `(${src.subreddit})` : ""}
                  </Text>
                </TouchableOpacity>
              ))}

              <Text style={styles.redditHint}>
                These links were used as extra context. Tap to open them in your
                browser for more details.
              </Text>
            </View>
          )}
        </>
      )}

      {/* Bottom buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.buttonSecondary}
          onPress={handleExportPdf}
        >
          <Ionicons name="document-outline" size={16} color="#fff" />
          <Text style={styles.buttonSecondaryText}>Export as PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buttonPrimary}>
          <Ionicons name="chatbubbles-outline" size={16} color="#000" />
          <Text style={styles.buttonPrimaryText}>Talk to Ustaad</Text>
        </TouchableOpacity>
      </View>
      
      {/* Bottom buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.buttonSecondary}
          onPress={handleExportPdf}
        >
          <Ionicons name="document-outline" size={16} color="#fff" />
          <Text style={styles.buttonSecondaryText}>Export as PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buttonPrimary}>
          <Ionicons name="chatbubbles-outline" size={16} color="#000" />
          <Text style={styles.buttonPrimaryText}>Talk to Ustaad</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#020617" },

  // Tabs
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#1f2937",
    backgroundColor: "#020617",
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: "#FACC15",
  },
  tabText: {
    color: "#6b7280",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "SpaceGrotesk_600SemiBold",
  },
  tabTextActive: {
    color: "#f9fafb",
  },

  // DTC list
  list: {
    padding: 16,
  },
 
  dtcInfo: {
    flex: 1,
    flexShrink: 1,
    paddingRight: 12,
  },
  dtcCode: {
  fontSize: 18,
  fontWeight: "800",
  color: "#F9FAFB",
  fontFamily: "SpaceGrotesk_800ExtraBold",
},
dtcDesc: {
  fontSize: 13,
  color: "#CBD5E1", // lighter text instead of gray
  fontFamily: "SpaceGrotesk_400Regular",
},


  dtcItemOuter: {
    borderRadius: 20,
    padding: 2,            // thickness of the glowing border
    marginHorizontal: 12,
    marginBottom: 18,
  },

  // INNER dark card
  dtcItemInner: {
    backgroundColor: "rgba(2, 6, 23, 0.95)",  
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
  shadowOpacity: 0.55,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 3 },
  elevation: 4, // Android
  },

  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: 10,        // keeps it away from text
    backgroundColor: "#4b5563",
  },
  statusActive: {
    backgroundColor: "#22c55e",
  },

  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: "#6b7280",
    fontSize: 16,
    fontFamily: "SpaceGrotesk_400Regular",
  },

  // Header & code badge
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#111827",
    backgroundColor: "#020617",
    fontFamily: "SpaceGrotesk_700Bold",
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#020617",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.5)",
    shadowColor: "#38bdf8",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
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
    fontFamily: "SpaceGrotesk_400Regular",
  },
  code: {
    fontSize: 24,
    fontFamily: "SpaceGrotesk_700Bold",
    fontWeight: "800",
    color: "#F9FAFB",
  },
  title: {
    fontSize: 20,
    fontFamily: "SpaceGrotesk_700Bold",
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "SpaceGrotesk_700Bold",
    fontWeight: "600",
    color: "#e5e7eb",
  },

  // Generic card
  sectionCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#020617",
    borderWidth: 1.2,
    borderColor: "rgba(148,163,184,0.9)",
    shadowColor: "#94a3b8",
    shadowOpacity: 0.5,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  sectionLabel: {
    fontSize: 13,
    color: "#9CA3AF",
    marginBottom: 8,
    fontFamily: "SpaceGrotesk_400Regular",
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "SpaceGrotesk_700Bold",
    fontWeight: "700",
    color: "#F9FAFB",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#D1D5DB",
    lineHeight: 22,
    marginTop: 4,
    fontFamily: "SpaceGrotesk_400Regular",
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
    fontFamily: "SpaceGrotesk_700Bold",
    fontWeight: "700",
    color: "#000",
  },

  // Possible causes – individual glowing cards
  causeCard: {
    marginTop: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#020617",
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1.2,
    borderColor: "rgba(248,113,113,0.9)", // warm red
    shadowColor: "#fb923c",
    shadowOpacity: 0.6,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 9,
  },
  causeIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(248,113,113,0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#fb923c",
  },
  causeTextWrapper: {
    flex: 1,
  },
  causeLabel: {
    fontSize: 11,
    fontFamily: "SpaceGrotesk_700Bold",
    fontWeight: "700",
    color: "#fb923c",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  causeText: {
    fontSize: 14,
    color: "#E5E7EB",
    lineHeight: 21,
    fontFamily: "SpaceGrotesk_400Regular",
  },

  // Effects / Symptoms – glowing cards
  effectCard: {
    marginTop: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#020617",
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1.2,
    borderColor: "rgba(59,130,246,0.9)", // blue
    shadowColor: "#3b82f6",
    shadowOpacity: 0.6,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 9,
  },
  effectIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(59,130,246,0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#3b82f6",
  },
  effectTextWrapper: {
    flex: 1,
  },
  effectLabel: {
    fontSize: 11,
    fontFamily: "SpaceGrotesk_700Bold",
    fontWeight: "700",
    color: "#3b82f6",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  effectText: {
    fontSize: 14,
    color: "#E5E7EB",
    lineHeight: 21,
    fontFamily: "SpaceGrotesk_400Regular",
  },

  // Actionable Advice – glowing green/blue
  actionCard: {
    marginTop: 14,
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#020617",
    borderWidth: 1.2,
    borderColor: "rgba(45,212,191,0.9)",
    shadowColor: "#22c55e",
    shadowOpacity: 0.6,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  actionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  checkIconBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#22c55e",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    backgroundColor: "rgba(34,197,94,0.15)",
  },
  actionLabel: {
    fontSize: 12,
    fontFamily: "SpaceGrotesk_700Bold",
    fontWeight: "700",
    color: "#93c5fd",
    letterSpacing: 0.7,
  },
  actionStep: {
    color: "#f1f5f9",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 4,
    fontFamily: "SpaceGrotesk_400Regular",
  },
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 2,
  },
  locationLabel: {
    fontSize: 12,
    fontFamily: "SpaceGrotesk_700Bold",
    fontWeight: "700",
    color: "#38bdf8",
    textTransform: "uppercase",
    marginLeft: 6,
    letterSpacing: 0.7,
  },
  locationText: {
    color: "#94a3b8",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
    fontFamily: "SpaceGrotesk_400Regular",
  },

  // Reddit section
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
    fontFamily: "SpaceGrotesk_400Regular",
  },
  redditHint: {
    color: "#6B7280",
    fontSize: 11,
    marginTop: 10,
    fontFamily: "SpaceGrotesk_400Regular",
  },

  // Technical terms section
  techHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  techIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#0f172a",
    borderWidth: 1.2,
    borderColor: "rgba(56,189,248,0.9)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    shadowColor: "#38bdf8",
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  techTermRow: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#111827",
  },
  techTermChip: {
    alignSelf: "flex-start",
    backgroundColor: "#020617",
    borderRadius: 999,
    borderWidth: 1.2,
    borderColor: "rgba(56,189,248,0.9)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 4,
    shadowColor: "#38bdf8",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 7,
  },
  techTermName: {
    fontSize: 12,
    fontFamily: "SpaceGrotesk_700Bold",
    fontWeight: "700",
    color: "#e0f2fe",
  },
  techTermDescription: {
    fontSize: 13,
    color: "#D1D5DB",
    lineHeight: 20,
    fontFamily: "SpaceGrotesk_400Regular",
  },

  // Footer buttons
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
    fontFamily: "SpaceGrotesk_700Bold",
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
    fontFamily: "SpaceGrotesk_700Bold",
    fontWeight: "700",
    fontSize: 14,
    marginLeft: 6,
  },

  // Loading / error
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 8,
    color: "#ccc",
    fontFamily: "SpaceGrotesk_400Regular",
  },
  errorText: {
    color: "#fca5a5",
    fontSize: 14,
    marginLeft: 8,
    fontFamily: "SpaceGrotesk_400Regular",
  },
});