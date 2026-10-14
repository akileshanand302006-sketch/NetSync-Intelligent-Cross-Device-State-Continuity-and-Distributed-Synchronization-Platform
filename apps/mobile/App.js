import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  const [activeTab, setActiveTab] = useState('tabs');
  const [incomingHandoff, setIncomingHandoff] = useState({
    title: 'RFC 9293 — Transmission Control Protocol Specification',
    url: 'https://datatracker.ietf.org/doc/html/rfc9293',
    scroll: 48,
    sourceDevice: 'Workstation Alpha',
  });

  const [clipboardItems, setClipboardItems] = useState([
    { id: '1', text: 'git clone https://github.com/netsync/netsync-platform.git', time: 'Just now' },
    { id: '2', text: 'Meeting summary: Finalized binary framing header with CRC32', time: '5m ago' },
  ]);

  const [newClip, setNewClip] = useState('');

  const handlePushClip = () => {
    if (!newClip.trim()) return;
    setClipboardItems([
      { id: Date.now().toString(), text: newClip, time: 'Just now' },
      ...clipboardItems,
    ]);
    setNewClip('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={styles.pulseDot} />
          <Text style={styles.brand}>NetSync Mobile</Text>
          <View style={styles.badgePill}>
            <Text style={styles.badgeText}>3.8ms RTT</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>Direct Wi-Fi 6 Mesh Peer • mDNS Connected</Text>
      </View>

      {/* Incoming Handoff Alert Banner */}
      {incomingHandoff && (
        <View style={styles.handoffCard}>
          <View style={styles.handoffHeader}>
            <Text style={styles.handoffTag}>⚡ CONTINUITY HANDOFF BEAM</Text>
            <Text style={styles.handoffSource}>from {incomingHandoff.sourceDevice}</Text>
          </View>
          <Text style={styles.handoffTitle}>{incomingHandoff.title}</Text>
          <Text style={styles.handoffUrl}>{incomingHandoff.url}</Text>
          <View style={styles.handoffFooter}>
            <Text style={styles.handoffScroll}>Restoring Scroll: {incomingHandoff.scroll}%</Text>
            <TouchableOpacity style={styles.btnOpen} onPress={() => alert(`Opening tab restored at ${incomingHandoff.scroll}% scroll!`)}>
              <Text style={styles.btnOpenText}>Resume Here</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Navigation tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'tabs' && styles.tabButtonActive]}
          onPress={() => setActiveTab('tabs')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'tabs' && styles.tabButtonTextActive]}>
            Active Tabs (4)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'clipboard' && styles.tabButtonActive]}
          onPress={() => setActiveTab('clipboard')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'clipboard' && styles.tabButtonTextActive]}>
            Universal Clipboard
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {activeTab === 'tabs' ? (
          <View style={styles.list}>
            {[
              { id: '1', title: 'RFC 9293 — TCP Protocol Specification', scroll: 48, url: 'datatracker.ietf.org' },
              { id: '2', title: 'NetSync Protocol Engine Architecture', scroll: 82, url: 'netsync.internal/docs' },
              { id: '3', title: 'Distributed Systems & CRDT Formats', scroll: 15, url: 'research.distributed.io' },
              { id: '4', title: 'FastAPI High-Performance Async WebSocket', scroll: 90, url: 'fastapi.tiangolo.com' },
            ].map((tab) => (
              <View key={tab.id} style={styles.card}>
                <Text style={styles.cardTitle}>{tab.title}</Text>
                <Text style={styles.cardUrl}>{tab.url}</Text>
                <View style={styles.progressContainer}>
                  <View style={[styles.progressBar, { width: `${tab.scroll}%` }]} />
                </View>
                <Text style={styles.cardScroll}>Scroll: {tab.scroll}%</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.list}>
            <View style={styles.clipComposer}>
              <TextInput
                style={styles.clipInput}
                placeholder="Broadcast text to mesh..."
                placeholderTextColor="#64748b"
                value={newClip}
                onChangeText={setNewClip}
              />
              <TouchableOpacity style={styles.btnPush} onPress={handlePushClip}>
                <Text style={styles.btnPushText}>Push to Mesh</Text>
              </TouchableOpacity>
            </View>

            {clipboardItems.map((item) => (
              <View key={item.id} style={styles.clipCard}>
                <View style={styles.clipHeader}>
                  <Text style={styles.clipSource}>Peer Item</Text>
                  <Text style={styles.clipTime}>{item.time}</Text>
                </View>
                <Text style={styles.clipText}>{item.text}</Text>
                <TouchableOpacity style={styles.btnCopy} onPress={() => alert('Copied to mobile clipboard!')}>
                  <Text style={styles.btnCopyText}>Copy</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060913',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  brand: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
  },
  badgePill: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  badgeText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '700',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
  },
  handoffCard: {
    margin: 16,
    padding: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  handoffTag: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '800',
  },
  handoffSource: {
    color: '#94a3b8',
    fontSize: 11,
  },
  handoffHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  handoffTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  handoffUrl: {
    color: '#64748b',
    fontSize: 12,
    marginBottom: 10,
  },
  handoffFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  handoffScroll: {
    color: '#34d399',
    fontSize: 12,
    fontWeight: '600',
  },
  btnOpen: {
    backgroundColor: '#38bdf8',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnOpenText: {
    color: '#090d16',
    fontWeight: '700',
    fontSize: 12,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 10,
    padding: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  tabButtonText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: '#38bdf8',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  list: {
    gap: 12,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 14,
  },
  cardTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardUrl: {
    color: '#64748b',
    fontSize: 12,
    marginBottom: 8,
  },
  progressContainer: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 2,
    marginBottom: 6,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#38bdf8',
  },
  cardScroll: {
    color: '#94a3b8',
    fontSize: 11,
    textAlign: 'right',
  },
  clipComposer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  clipInput: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#f8fafc',
    fontSize: 13,
  },
  btnPush: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: 8,
  },
  btnPushText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 12,
  },
  clipCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 14,
  },
  clipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  clipSource: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '600',
  },
  clipTime: {
    color: '#64748b',
    fontSize: 11,
  },
  clipText: {
    color: '#f1f5f9',
    fontSize: 13,
    marginBottom: 10,
    fontFamily: 'monospace',
  },
  btnCopy: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  btnCopyText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
  },
});
