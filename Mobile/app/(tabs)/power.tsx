import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Provider, Menu, Portal, Dialog, Button, Checkbox } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../(component)/api/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { router, useNavigation } from 'expo-router';

const screenWidth = Dimensions.get('window').width;
const API_BASE = 'http://10.251.102.203:5001';
const RESAMPLE_MINUTES = 15;

type MetricKey = 'ambient_lux' | 'occupancy' | 'motion' | 'brightness_pct';


type SamplePoint = { ts: number; metrics: Partial<Record<MetricKey, number>> };

interface ChartData {
  labels: string[];
  datasets: { data: number[]; color?: (opacity?: number) => string; strokeWidth?: number }[];
}

const METRIC_DEFS: Record<MetricKey, { label: string; unit: string; color: string }> = {
  ambient_lux: { label: 'Ambient Light', unit: 'lux', color: '#fbc02d' },
  occupancy: { label: 'Occupancy', unit: '', color: '#3949ab' },
  motion: { label: 'Motion', unit: '', color: '#8e24aa' },
  brightness_pct: { label: 'Brightness', unit: '%', color: '#26c6da' },
};

const TIME_RANGES = [1, 6, 12, 24] as const;
type TimeRange = (typeof TIME_RANGES)[number];

function colorWithOpacity(hex: string, opacity = 1) {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function resampleBuffer(points: SamplePoint[], minutes: number): SamplePoint[] {
  const bucketMs = minutes * 60 * 1000;
  const buckets = new Map<
    number,
    { metrics: Record<MetricKey, { sum: number; count: number; max: number }> }
  >();
  for (const p of points) {
    const b = Math.floor(p.ts / bucketMs) * bucketMs;
    const agg = buckets.get(b) ?? { metrics: {} as any };
    buckets.set(b, agg);
    for (const key of Object.keys(p.metrics) as MetricKey[]) {
      const v = p.metrics[key];
      if (typeof v !== 'number') continue;
      const m = (agg.metrics[key] ??= { sum: 0, count: 0, max: -Infinity });
      if (key === 'occupancy') {
        m.max = Math.max(m.max, v);
      } else {
        m.sum += v;
        m.count += 1;
      }
    }
  }
  return Array.from(buckets.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([ts, agg]) => {
      const metrics: Partial<Record<MetricKey, number>> = {};
      for (const key of Object.keys(agg.metrics) as MetricKey[]) {
        const m = agg.metrics[key];
        metrics[key] = key === 'occupancy' ? (m.max > 0 ? 1 : 0) : (m.count ? m.sum / m.count : 0);
      }
      return { ts, metrics };
    });
}

export default function PowerAndSensorsScreen() {
  const navigation = useNavigation();
  const [menuVisible, setMenuVisible] = useState(false);
  const [rooms, setRooms] = useState<{ [roomName: string]: { brightness: number; temperature: number } }>({});
  const [userInfo, setUserInfo] = useState<any | undefined>(null);
  const [roomKey, setRoomKey] = useState<string>('Data');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => user && setUserInfo(user));
    return () => unsub();
  }, []);

  useEffect(() => {
    const fetchRooms = async () => {
      if (!userInfo) return;
      try {
        const docRef = doc(db, 'users', userInfo.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as any;
          const r = data.rooms || {};
          setRooms(r);
          const keys = Object.keys(r);
          if (keys.length && (!roomKey || roomKey === 'Power & Sensors')) setRoomKey(keys[0]);
        }
      } catch (e) {
        console.warn('Failed to fetch rooms', e);
      }
    };
    fetchRooms();
  }, [userInfo]);

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);
  const handleSignOut = async () => {
    await auth.signOut();
    navigation.navigate('(component)/(auth)/login' as unknown as never);
  };

  // Time range + filters
  const [timeMenuVisible, setTimeMenuVisible] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>(6);
  const [filterVisible, setFilterVisible] = useState(false);
  const defaultSelected: MetricKey[] = ['ambient_lux', 'occupancy', 'motion', 'brightness_pct'];
  const [selectedMetrics, setSelectedMetrics] = useState<Set<MetricKey>>(new Set(defaultSelected));
  const [draftSelected, setDraftSelected] = useState<Set<MetricKey>>(new Set(defaultSelected));

  // Data
  const [buffer, setBuffer] = useState<SamplePoint[]>([]);
  const nowMs = Date.now();
  const horizonMs = timeRange * 3600 * 1000;

  const recentBuffer = useMemo(
    () => buffer.filter(p => (nowMs - p.ts) <= horizonMs && p.ts <= nowMs),
    [buffer, nowMs, horizonMs]
  );

  const resampled = useMemo(
    () => resampleBuffer(recentBuffer, RESAMPLE_MINUTES),
    [recentBuffer]
  );

 const fetchFromApi = async (hours: number) => {
   try {
     const res = await fetch(`${API_BASE}/api/samples?hours=${hours}`);
     const j = await res.json();
     const points: SamplePoint[] = (j.samples || []).map((s: any) => {
      const m = s.metrics || {};
      // Derive motion from motion_detected if needed
      if (m.motion === undefined && m.motion_detected !== undefined) {
        m.motion = m.motion_detected ? 1 : 0;
      }
      return {
        ts: Date.parse(s.ts),
        metrics: m,
      };
    });
    setBuffer(points);
  } catch (e) {
    console.warn('Fetch failed', e);
    Alert.alert('Data fetch failed', String(e));
  }
};

  useEffect(() => {
    fetchFromApi(timeRange);
    const id = setInterval(() => fetchFromApi(timeRange), 30000);
    return () => clearInterval(id);
  }, [timeRange]);

  const chartData: ChartData = useMemo(() => {
    const fmt = (t: number) => {
      const d = new Date(t);
      const hh = d.getHours().toString().padStart(2, '0');
      const mm = d.getMinutes().toString().padStart(2, '0');
      return `${hh}:${mm}`;
    };
    // Base labels from resampled timestamps
    let labels = resampled.map((p) => fmt(p.ts));
    if (labels.length === 0) labels = ['-', '-'];
    else if (labels.length === 1) labels = [labels[0], labels[0]];

    const datasets = Array.from(selectedMetrics).map((key) => {
      let data = resampled.map((p) => {
        const v = p.metrics[key];
        const isBinary = key === 'occupancy' || key === 'motion';
        const n = isBinary ? (v && v > 0 ? 1 : 0) : typeof v === 'number' ? v : 0;
        return Number.isFinite(n) ? n : 0;
      });
      if (data.length === 0) data = [0, 0];
      else if (data.length === 1) data = [data[0], data[0]];
      return {
        data,
        color: (opacity = 1) => colorWithOpacity(METRIC_DEFS[key].color, opacity),
        strokeWidth: 2,
      };
    });
    return { labels, datasets };
  }, [resampled, selectedMetrics]);

  const toggleDraftMetric = (key: MetricKey) => {
    setDraftSelected((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };
  const openFilter = () => {
    setDraftSelected(new Set(selectedMetrics));
    setFilterVisible(true);
  };
  const applyFilter = () => {
    setSelectedMetrics(new Set(draftSelected));
    setFilterVisible(false);
  };

  return (
    <Provider>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.headerRow}>
          <Menu
            visible={menuVisible}
            onDismiss={closeMenu}
            anchor={
              <Pressable onPress={openMenu} style={styles.headerAnchor}>
                <Text style={styles.headerTitle}>{roomKey}</Text>
                <Ionicons name="chevron-down" size={20} color="#4CAF50" />
              </Pressable>
            }
          >
            <Menu.Item
              onPress={() => {
                closeMenu();
                Alert.alert('Auth App', 'Are you sure you want to sign out?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Logout', onPress: handleSignOut },
                ]);
              }}
              title="Sign Out"
            />
          </Menu>

          <View style={styles.headerRight}>
            <Menu
              visible={timeMenuVisible}
              onDismiss={() => setTimeMenuVisible(false)}
              anchor={
                <Pressable onPress={() => setTimeMenuVisible(true)} style={styles.timeAnchor}>
                  <Ionicons name="time-outline" size={18} color="#4CAF50" />
                  <Text style={styles.timeText}>Last {timeRange}h</Text>
                  <Ionicons name="chevron-down" size={16} color="#4CAF50" />
                </Pressable>
              }
            >
              {TIME_RANGES.map((h) => (
                <Menu.Item
                  key={h}
                  onPress={() => {
                    setTimeRange(h);
                    setTimeMenuVisible(false);
                  }}
                  title={`Last ${h} hour${h === 1 ? '' : 's'}`}
                />
              ))}
            </Menu>

            <Pressable onPress={openFilter} style={styles.filterBtn} accessibilityLabel="Select series">
              <Ionicons name="options-outline" size={20} color="#4CAF50" />
            </Pressable>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
          <View style={styles.chartContainer}>
            <View style={styles.legendRow}>
              {Array.from(selectedMetrics).map((key) => (
                <View key={key} style={styles.legendItem}>
                  <View style={[styles.legendSwatch, { backgroundColor: METRIC_DEFS[key].color }]} />
                  <Text style={styles.legendText}>{METRIC_DEFS[key].label}</Text>
                </View>
              ))}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View>
                <LineChart
                  data={chartData}
                  width={Math.max(screenWidth, chartData.labels.length * 40)}
                  height={320}
                  chartConfig={{
                    backgroundColor: '#ffffff',
                    backgroundGradientFrom: '#ffffff',
                    backgroundGradientTo: '#ffffff',
                    decimalPlaces: 1,
                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    propsForDots: { r: '2' },
                    propsForBackgroundLines: { strokeDasharray: '4 4' },
                  }}
                  bezier
                  style={styles.chartStyle}
                />
              </View>
            </ScrollView>
            <Text style={styles.axisLabel}>Time</Text>
          </View>

        </ScrollView>

        <Portal>
          <Dialog visible={filterVisible} onDismiss={() => setFilterVisible(false)}>
            <Dialog.Title>Select metrics</Dialog.Title>
            <Dialog.Content>
              {Object.keys(METRIC_DEFS).map((k) => {
                const key = k as MetricKey;
                const checked = draftSelected.has(key);
                return (
                  <Pressable
                    key={key}
                    onPress={() => toggleDraftMetric(key)}
                    style={styles.checkboxRow}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked }}
                  >
                    <Checkbox status={checked ? 'checked' : 'unchecked'} />
                    <View style={styles.checkboxLabelWrap}>
                      <Text style={styles.checkboxLabel}>{METRIC_DEFS[key].label}</Text>
                      <View style={[styles.legendSwatch, { backgroundColor: METRIC_DEFS[key].color, marginLeft: 6 }]} />
                    </View>
                  </Pressable>
                );
              })}
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setFilterVisible(false)}>Cancel</Button>
              <Button onPress={applyFilter}>Apply</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </SafeAreaView>
    </Provider>
  );
}

const styles = StyleSheet.create({
  headerRow: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerAnchor: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#4CAF50', marginRight: 4 },
  pageTitle: { fontSize: 16, fontWeight: '600', color: '#222' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  timeAnchor: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6 },
  timeText: { marginHorizontal: 4, color: '#4CAF50', fontWeight: '600' },
  filterBtn: { marginLeft: 8, padding: 6, borderRadius: 6 },
  chartContainer: { marginHorizontal: 6, marginTop: 6, backgroundColor: '#fff', borderRadius: 12, padding: 8, elevation: 2 },
  chartStyle: { marginVertical: 8, borderRadius: 8 },
  axisLabel: { textAlign: 'center', color: '#333', marginTop: -2, marginBottom: 6 },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 6, paddingTop: 6, paddingBottom: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginRight: 10, marginBottom: 6 },
  legendSwatch: { width: 14, height: 14, borderRadius: 3, marginRight: 6 },
  legendText: { color: '#333', fontSize: 12 },
  totalsContainer: { marginTop: 12, marginHorizontal: 10 },
  totalText: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 4 },
  tableContainer: { marginTop: 16, marginHorizontal: 6, borderWidth: 1, borderColor: '#ccc', borderRadius: 10, overflow: 'hidden', backgroundColor: '#fafafa' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eaeaea' },
  tableCell: { minWidth: 120, padding: 10, textAlign: 'center', fontSize: 13, color: '#222' },
  tableHeader: { fontWeight: 'bold', backgroundColor: '#f0f0f0', color: '#000' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  checkboxLabelWrap: { flexDirection: 'row', alignItems: 'center' },
  checkboxLabel: { fontSize: 15 },
});