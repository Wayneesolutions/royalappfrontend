import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import apiService from '../../../services/api';

/**
 * My Rewards — the dealer's loyalty wallet, schemes and payouts.
 * Korvo hands out a short-lived Loyvexa token (GET /rewards/session); the
 * screen then talks to Loyvexa's participant API directly with that token.
 */

interface Me {
  participant: { id: string; type: string; name: string; mobile: string; upiId?: string | null };
  brand?: { name?: string };
  wallet: { balance: number; held?: number };
  rupeeValue?: number;
  minRedeemPoints?: number;
  pointValuePaise?: number;
}
interface Scheme {
  name: string;
  type: string;
  metric?: string;
  endsAt?: string;
  progress?: { value?: number; slab?: any; nextSlab?: any; remainingToNext?: number; points?: number };
}
interface Entry { type: string; points: number; note?: string; created_at: string }

const inr = (n: number) => '₹' + Math.round(n || 0).toLocaleString('en-IN');
const rewardText = (sl: any) =>
  !sl ? '' : sl.rewardType === 'PERCENT' ? `${sl.value}% bonus` : sl.rewardType === 'PER_UNIT' ? `${sl.value} pts/unit` : `${sl.value} points`;
const unitOf = (metric?: string) => (metric === 'SCANS' ? 'scans' : 'units');
/** "₹12,000 more to reach the ₹50,000 slab (2% bonus)" */
function progressLine(s: Scheme) {
  const p = s.progress || {};
  const amt = s.metric === 'AMOUNT';
  const show = (n: number) => (amt ? inr(n) : `${(n || 0).toLocaleString('en-IN')} ${unitOf(s.metric)}`);
  if (p.nextSlab) return `${show(p.remainingToNext || 0)} more to reach the ${show(p.nextSlab.min)} slab (${rewardText(p.nextSlab)})`;
  if (p.slab) return `Top slab reached — ${rewardText(p.slab)} 🎉`;
  return 'Keep ordering to qualify';
}
const fmtDate = (s?: string) => (s ? new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '');

export default function RewardsScreen() {
  const navigation = useNavigation<any>();
  const [session, setSession] = useState<{ token: string; baseUrl: string } | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [upi, setUpi] = useState('');
  const [points, setPoints] = useState('');
  const [busy, setBusy] = useState(false);

  const call = async (s: { token: string; baseUrl: string }, path: string, init: RequestInit = {}) => {
    const res = await fetch(`${s.baseUrl}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s.token}`, ...(init.headers || {}) },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body?.error?.message || body?.message || `Request failed (${res.status})`);
    return body;
  };

  const load = useCallback(async () => {
    setProblem(null);
    const s = await apiService.getRewardsSession();
    if (!s.success || !s.token) {
      setProblem(
        s.code === 'NOT_LINKED'
          ? 'Rewards are not switched on for your company yet. Ask your brand to connect Loyvexa.'
          : s.code === 'NOT_ENROLLED'
          ? 'You are not enrolled in the loyalty programme yet. Your sales team can add you.'
          : s.message || 'Rewards are not reachable right now.'
      );
      return;
    }
    const sess = { token: s.token, baseUrl: s.baseUrl.replace(/\/$/, '') };
    setSession(sess);
    const [m, sc, lg] = await Promise.all([call(sess, '/api/p/me'), call(sess, '/api/p/schemes'), call(sess, '/api/p/ledger')]);
    setMe(m);
    setUpi(m?.participant?.upiId || '');
    setSchemes(sc?.schemes || []);
    setEntries((lg?.entries || []).slice(0, 15));
  }, []);

  useEffect(() => {
    load().catch((e) => setProblem(e.message)).finally(() => setLoading(false));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    try { await load(); } catch (e: any) { setProblem(e.message); }
    setRefreshing(false);
  };

  const redeem = async () => {
    if (!session || !me) return;
    const p = parseInt(points, 10);
    const min = me.minRedeemPoints || 0;
    if (!p || p <= 0) return Alert.alert('Points', 'Enter how many points to cash out.');
    if (p > me.wallet.balance) return Alert.alert('Points', 'That is more than your balance.');
    if (min && p < min) return Alert.alert('Points', `Minimum cash-out is ${min.toLocaleString('en-IN')} points.`);
    if (!/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(upi.trim())) return Alert.alert('UPI', 'Enter a valid UPI ID, e.g. name@okaxis');
    setBusy(true);
    try {
      if (upi.trim() !== (me.participant.upiId || '')) {
        await call(session, '/api/p/me', { method: 'PATCH', body: JSON.stringify({ upiId: upi.trim() }) });
      }
      const r = await call(session, '/api/p/redeem', { method: 'POST', body: JSON.stringify({ points: p }) });
      Alert.alert('Cash-out requested', r?.message || `${p.toLocaleString('en-IN')} points will be paid to ${upi.trim()}.`);
      setPoints('');
      await load();
    } catch (e: any) {
      Alert.alert('Could not cash out', e.message);
    } finally {
      setBusy(false);
    }
  };

  const pv = (me?.pointValuePaise || 0) / 100;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Rewards</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#2563EB" /></View>
      ) : problem ? (
        <View style={styles.center}>
          <Ionicons name="gift-outline" size={48} color="#9CA3AF" />
          <Text style={styles.problem}>{problem}</Text>
          <TouchableOpacity style={styles.retry} onPress={() => { setLoading(true); load().catch((e) => setProblem(e.message)).finally(() => setLoading(false)); }}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
          <View style={styles.wallet}>
            <Text style={styles.walletLabel}>{me?.brand?.name ? `${me.brand.name} Rewards` : 'Reward points'}</Text>
            <Text style={styles.walletPoints}>{(me?.wallet.balance || 0).toLocaleString('en-IN')} pts</Text>
            <Text style={styles.walletRupees}>≈ {inr(me?.rupeeValue ?? (me?.wallet.balance || 0) * pv)}</Text>
            {!!me?.wallet.held && <Text style={styles.walletHeld}>{me.wallet.held.toLocaleString('en-IN')} pts on hold for review</Text>}
          </View>

          <Text style={styles.section}>Running schemes</Text>
          {schemes.length === 0 && <Text style={styles.muted}>No schemes running right now.</Text>}
          {schemes.map((s, i) => {
            const val = s.progress?.value || 0;
            const pct = s.progress?.nextSlab ? Math.min(100, (val / Math.max(1, s.progress.nextSlab.min)) * 100) : s.progress?.slab ? 100 : 0;
            return (
              <View key={i} style={styles.card}>
                <View style={styles.rowBetween}>
                  <Text style={styles.cardTitle}>{s.name}</Text>
                  {!!s.endsAt && <Text style={styles.muted}>till {fmtDate(s.endsAt)}</Text>}
                </View>
                <View style={styles.bar}><View style={[styles.barFill, { width: `${pct}%` }]} /></View>
                <Text style={styles.cardText}>{progressLine(s)}</Text>
                {!!s.progress?.points && <Text style={styles.earned}>+{s.progress.points.toLocaleString('en-IN')} pts earned so far</Text>}
              </View>
            );
          })}

          <Text style={styles.section}>Cash out to UPI</Text>
          <View style={styles.card}>
            <TextInput style={styles.input} placeholder="UPI ID (name@bank)" autoCapitalize="none" value={upi} onChangeText={setUpi} />
            <TextInput style={styles.input} placeholder={`Points${me?.minRedeemPoints ? ` (min ${me.minRedeemPoints})` : ''}`} keyboardType="number-pad" value={points} onChangeText={setPoints} />
            {!!points && pv > 0 && <Text style={styles.muted}>You get {inr(parseInt(points, 10) * pv || 0)}</Text>}
            <TouchableOpacity style={[styles.primary, busy && { opacity: 0.6 }]} onPress={redeem} disabled={busy}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Request cash-out</Text>}
            </TouchableOpacity>
          </View>

          <Text style={styles.section}>Recent activity</Text>
          {entries.length === 0 && <Text style={styles.muted}>Nothing yet. Points appear here when your orders are confirmed.</Text>}
          {entries.map((e, i) => (
            <View key={i} style={styles.entry}>
              <View style={{ flex: 1 }}>
                <Text style={styles.entryNote}>{e.note || e.type}</Text>
                <Text style={styles.muted}>{fmtDate(e.created_at)}</Text>
              </View>
              <Text style={[styles.entryPts, { color: e.points >= 0 ? '#059669' : '#DC2626' }]}>
                {e.points >= 0 ? '+' : ''}{e.points.toLocaleString('en-IN')}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 52, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  back: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  problem: { marginTop: 12, textAlign: 'center', color: '#4B5563', fontSize: 15, lineHeight: 22 },
  retry: { marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, backgroundColor: '#2563EB' },
  retryText: { color: '#fff', fontWeight: '600' },
  wallet: { backgroundColor: '#1E3A8A', borderRadius: 16, padding: 20 },
  walletLabel: { color: '#BFDBFE', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  walletPoints: { color: '#fff', fontSize: 32, fontWeight: '800', marginTop: 6 },
  walletRupees: { color: '#DBEAFE', fontSize: 16, marginTop: 2 },
  walletHeld: { color: '#FDE68A', fontSize: 12, marginTop: 8 },
  section: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 24, marginBottom: 10 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#111827', flex: 1, marginRight: 8 },
  cardText: { fontSize: 13, color: '#374151', marginTop: 8 },
  earned: { fontSize: 12, color: '#059669', marginTop: 4, fontWeight: '600' },
  bar: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, marginTop: 10, overflow: 'hidden' },
  barFill: { height: 8, backgroundColor: '#F59E0B', borderRadius: 4 },
  muted: { fontSize: 12, color: '#6B7280' },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, marginBottom: 10, color: '#111827' },
  primary: { backgroundColor: '#2563EB', borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  entry: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: '#F3F4F6' },
  entryNote: { fontSize: 14, color: '#111827', marginBottom: 2 },
  entryPts: { fontSize: 15, fontWeight: '700' },
});
