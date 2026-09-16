import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  ScrollView,
  Platform,
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';
import { CreovatorTheme } from '@/constants/theme';
import { CreovatorHeader, CreovatorInput, CreovatorButton, CreovatorCard } from '@/components/creovator';

export interface Participant {
  id: string;
  event_id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  organization?: string | null;
  category?: string;
  day_number?: number;
  list_name?: string;
}

const TECH_DEFAULT_LISTS = ['Exhibitors', 'Judges', 'Volunteers', 'Visitors'];

export default function EventParticipantsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const eventId = id as string;

  const [event, setEvent] = useState<any>(null);
  const [totalDays, setTotalDays] = useState(1);
  const [activeDay, setActiveDay] = useState(1);

  // Lists
  const [activeList, setActiveList] = useState('Exhibitors');
  const [availableLists, setAvailableLists] = useState<string[]>(TECH_DEFAULT_LISTS);
  const [customListsPerDay, setCustomListsPerDay] = useState<Record<number, string[]>>({});

  // Participants data
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addListModalVisible, setAddListModalVisible] = useState(false);

  // Participant Form
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formOrg, setFormOrg] = useState('');
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Custom List Form
  const [newListName, setNewListName] = useState('');

  // 1. Load Event & Days
  const loadEventInfo = async () => {
    if (!eventId) return;

    try {
      setLoading(true);
      const { data: eventData, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error || !eventData) {
        Alert.alert('Error', 'Event not found');
        router.back();
        return;
      }

      setEvent(eventData);

      // Compute days
      const start = new Date(eventData.start_date);
      const end = new Date(eventData.end_date);
      const diff = Math.abs(end.getTime() - start.getTime());
      const days = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1);
      setTotalDays(days);

      // Fetch custom lists from event_days
      const { data: dayRows } = await supabase
        .from('event_days')
        .select('*')
        .eq('event_id', eventId)
        .order('day_number', { ascending: true });

      const listsMap: Record<number, string[]> = {};
      dayRows?.forEach((row: any) => {
        if (row.custom_lists && Array.isArray(row.custom_lists)) {
          listsMap[row.day_number] = row.custom_lists;
        }
      });
      setCustomListsPerDay(listsMap);

      // Set initial active list
      const isTech = eventData.type === 'tech';
      const initialLists = listsMap[1] || (isTech ? TECH_DEFAULT_LISTS : ['Guest List']);
      setAvailableLists(initialLists);
      setActiveList(initialLists[0] || 'Participants');
    } catch (err: any) {
      console.error('Failed to load event:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Load Participants for current Event, Day & List
  const loadParticipants = async () => {
    if (!eventId) return;

    try {
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .eq('event_id', eventId)
        .eq('day_number', activeDay)
        .eq('list_name', activeList)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setParticipants(data);
      }
    } catch (err: any) {
      console.error('Failed to load participants:', err.message);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadEventInfo();
    }, [eventId])
  );

  useEffect(() => {
    const isTech = event?.type === 'tech';
    const dayLists = customListsPerDay[activeDay] || (isTech ? TECH_DEFAULT_LISTS : ['Guest List']);
    setAvailableLists(dayLists);
    if (!dayLists.includes(activeList)) {
      setActiveList(dayLists[0] || 'Participants');
    }
  }, [activeDay, customListsPerDay, event]);

  useEffect(() => {
    loadParticipants();
  }, [activeDay, activeList]);

  // Form Validation & Add/Edit Participant
  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!formName.trim() || formName.trim().length < 2) errs.name = 'Name must be at least 2 characters';
    if (formEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEmail.trim())) {
      errs.email = 'Invalid email address';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAddParticipant = async () => {
    if (!validateForm()) return;
    setSaving(true);

    try {
      const newRow = {
        event_id: eventId,
        day_number: activeDay,
        list_name: activeList,
        name: formName.trim(),
        email: formEmail.trim() || null,
        phone: formPhone.trim() || null,
        organization: formOrg.trim() || null,
        category: activeList,
      };

      const { data, error } = await supabase
        .from('participants')
        .insert([newRow])
        .select()
        .single();

      if (error) throw error;

      setParticipants([data, ...participants]);
      setAddModalVisible(false);
      resetForm();
    } catch (err: any) {
      Alert.alert('Add Failed', err.message || 'Could not add participant.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditParticipant = async () => {
    if (!validateForm() || !editingParticipant) return;
    setSaving(true);

    try {
      const updates = {
        name: formName.trim(),
        email: formEmail.trim() || null,
        phone: formPhone.trim() || null,
        organization: formOrg.trim() || null,
      };

      const { error } = await supabase
        .from('participants')
        .update(updates)
        .eq('id', editingParticipant.id);

      if (error) throw error;

      setParticipants(
        participants.map((p) => (p.id === editingParticipant.id ? { ...p, ...updates } : p))
      );
      setEditModalVisible(false);
      resetForm();
    } catch (err: any) {
      Alert.alert('Update Failed', err.message || 'Could not update participant.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteParticipant = (p: Participant) => {
    Alert.alert(
      'Remove Participant?',
      `Are you sure you want to remove "${p.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('participants').delete().eq('id', p.id);
              if (error) throw error;
              setParticipants(participants.filter((item) => item.id !== p.id));
            } catch (err: any) {
              Alert.alert('Delete Failed', err.message);
            }
          },
        },
      ]
    );
  };

  const openEditModal = (p: Participant) => {
    setEditingParticipant(p);
    setFormName(p.name);
    setFormEmail(p.email || '');
    setFormPhone(p.phone || '');
    setFormOrg(p.organization || '');
    setFormErrors({});
    setEditModalVisible(true);
  };

  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormOrg('');
    setFormErrors({});
    setEditingParticipant(null);
  };

  // Add Custom List
  const handleAddCustomList = async () => {
    const trimmed = newListName.trim();
    if (!trimmed || trimmed.length < 2) {
      Alert.alert('Invalid Name', 'List name must be at least 2 characters.');
      return;
    }

    if (availableLists.includes(trimmed)) {
      Alert.alert('Already Exists', 'A list with this name already exists.');
      return;
    }

    try {
      const updatedLists = [...availableLists, trimmed];
      setAvailableLists(updatedLists);
      setActiveList(trimmed);

      const { data: existingDay } = await supabase
        .from('event_days')
        .select('id')
        .eq('event_id', eventId)
        .eq('day_number', activeDay)
        .maybeSingle();

      if (existingDay) {
        await supabase
          .from('event_days')
          .update({ custom_lists: updatedLists })
          .eq('id', existingDay.id);
      } else {
        await supabase.from('event_days').insert([
          {
            event_id: eventId,
            day_number: activeDay,
            custom_lists: updatedLists,
          },
        ]);
      }

      setCustomListsPerDay({ ...customListsPerDay, [activeDay]: updatedLists });
      setNewListName('');
      setAddListModalVisible(false);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not add list.');
    }
  };

  // Import from Excel
  const handleImportExcel = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'text/csv',
        ],
        copyToCacheDirectory: true,
      });

      if (res.canceled || !res.assets || res.assets.length === 0) return;

      const fileUri = res.assets[0].uri;
      const b64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const workbook = XLSX.read(b64, { type: 'base64' });
      const firstSheet = workbook.SheetNames[0];
      const rows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet]);

      if (!rows || rows.length === 0) {
        Alert.alert('Empty Sheet', 'No data rows found in the selected spreadsheet.');
        return;
      }

      const toInsert: any[] = [];
      rows.forEach((r) => {
        const name = String(r.Name || r.name || r['Full Name'] || r.Participant || '').trim();
        const email = String(r.Email || r.email || '').trim();
        const phone = String(r.Phone || r.phone || r['Phone Number'] || '').trim();
        const org = String(r.Organization || r.organization || r.Company || '').trim();

        if (name && name.length >= 2) {
          toInsert.push({
            event_id: eventId,
            day_number: activeDay,
            list_name: activeList,
            category: activeList,
            name,
            email: email || null,
            phone: phone || null,
            organization: org || null,
          });
        }
      });

      if (toInsert.length === 0) {
        Alert.alert('Validation Error', 'No valid participant records found. Make sure columns contain "Name".');
        return;
      }

      const { data, error } = await supabase.from('participants').insert(toInsert).select();
      if (error) throw error;

      Alert.alert('Import Success! 🎉', `${toInsert.length} participants imported into "${activeList}".`);
      loadParticipants();
    } catch (err: any) {
      Alert.alert('Import Failed', err.message || 'Could not parse spreadsheet.');
    }
  };

  // Export to CSV
  const handleExportCSV = async () => {
    if (participants.length === 0) {
      Alert.alert('Export', 'No participants in this list to export.');
      return;
    }

    try {
      const headers = ['Name', 'Email', 'Phone', 'Organization', 'List', 'Day'];
      const rows = participants.map((p) => [
        `"${(p.name || '').replace(/"/g, '""')}"`,
        `"${(p.email || '').replace(/"/g, '""')}"`,
        `"${(p.phone || '').replace(/"/g, '""')}"`,
        `"${(p.organization || '').replace(/"/g, '""')}"`,
        `"${activeList}"`,
        `Day ${activeDay}`,
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const filename = `${event?.name || 'Creovator'}_${activeList}_Day${activeDay}.csv`.replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileUri = `${FileSystem.documentDirectory}${filename}`;

      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Exported', `File saved to ${fileUri}`);
      }
    } catch (err: any) {
      Alert.alert('Export Error', err.message);
    }
  };

  const filteredParticipants = participants.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.email && p.email.toLowerCase().includes(search.toLowerCase())) ||
    (p.organization && p.organization.toLowerCase().includes(search.toLowerCase()))
  );

  const renderParticipantItem = ({ item, index }: { item: Participant; index: number }) => (
    <CreovatorCard style={styles.participantCard}>
      <View style={styles.participantHeader}>
        <View style={styles.nameSection}>
          <View style={styles.indexPill}>
            <Text style={styles.indexText}>{index + 1}</Text>
          </View>
          <Text style={styles.participantName}>{item.name}</Text>
        </View>

        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => openEditModal(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="pencil-outline" size={16} color={CreovatorTheme.colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDeleteParticipant(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={16} color={CreovatorTheme.colors.destructive} />
          </TouchableOpacity>
        </View>
      </View>

      {item.organization ? (
        <View style={styles.detailRow}>
          <Ionicons name="business-outline" size={14} color={CreovatorTheme.colors.secondary} />
          <Text style={styles.detailText}>{item.organization}</Text>
        </View>
      ) : null}

      <View style={styles.contactRow}>
        {item.email ? (
          <TouchableOpacity
            style={styles.contactItem}
            onPress={() => Linking.openURL(`mailto:${item.email}`)}
          >
            <Ionicons name="mail-outline" size={14} color={CreovatorTheme.colors.cyan} />
            <Text style={styles.contactText} numberOfLines={1}>{item.email}</Text>
          </TouchableOpacity>
        ) : null}

        {item.phone ? (
          <TouchableOpacity
            style={styles.contactItem}
            onPress={() => Linking.openURL(`tel:${item.phone}`)}
          >
            <Ionicons name="call-outline" size={14} color={CreovatorTheme.colors.success} />
            <Text style={styles.contactText}>{item.phone}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </CreovatorCard>
  );

  return (
    <View style={styles.container}>
      <CreovatorHeader
        title={event?.name || 'Participants'}
        subtitle={`Day ${activeDay} • ${activeList}`}
        showBack
      />

      {/* Days Tabs */}
      {totalDays > 1 && (
        <View style={styles.daysBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysContent}>
            {Array.from({ length: totalDays }).map((_, idx) => {
              const dNum = idx + 1;
              return (
                <TouchableOpacity
                  key={dNum}
                  style={[styles.dayTab, activeDay === dNum && styles.activeDayTab]}
                  onPress={() => setActiveDay(dNum)}
                >
                  <Text style={[styles.dayTabText, activeDay === dNum && styles.activeDayTabText]}>
                    Day {dNum}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Lists Bar */}
      <View style={styles.listsBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.listsContent}>
          {availableLists.map((list) => (
            <TouchableOpacity
              key={list}
              style={[styles.listTab, activeList === list && styles.activeListTab]}
              onPress={() => setActiveList(list)}
            >
              <Text style={[styles.listTabText, activeList === list && styles.activeListTabText]}>
                {list}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.addListTab}
            onPress={() => setAddListModalVisible(true)}
          >
            <Ionicons name="add" size={16} color={CreovatorTheme.colors.secondary} />
            <Text style={styles.addListTabText}>Custom List</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Toolbar */}
      <View style={styles.toolbar}>
        <View style={{ flex: 1 }}>
          <CreovatorInput
            placeholder={`Search ${activeList}...`}
            value={search}
            onChangeText={setSearch}
            leftIcon={<Ionicons name="search" size={16} color={CreovatorTheme.colors.textMuted} />}
            containerStyle={{ marginBottom: 0 }}
          />
        </View>

        <TouchableOpacity
          style={styles.addParticipantBtn}
          onPress={() => {
            resetForm();
            setAddModalVisible(true);
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="person-add" size={18} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Utility Strip */}
      <View style={styles.utilityStrip}>
        <TouchableOpacity style={styles.utilBtn} onPress={handleImportExcel}>
          <Ionicons name="document-attach-outline" size={14} color={CreovatorTheme.colors.cyan} />
          <Text style={styles.utilBtnText}>Import Excel</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.utilBtn} onPress={handleExportCSV}>
          <Ionicons name="download-outline" size={14} color={CreovatorTheme.colors.textLight} />
          <Text style={styles.utilBtnText}>Export CSV</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.utilBtn, styles.utilBtnGold]}
          onPress={() =>
            router.push(
              `/certificates?event_id=${eventId}&list_name=${encodeURIComponent(activeList)}&day_number=${activeDay}` as any
            )
          }
        >
          <Ionicons name="ribbon-outline" size={14} color={CreovatorTheme.colors.secondary} />
          <Text style={[styles.utilBtnText, { color: CreovatorTheme.colors.secondary }]}>Certificates</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.utilBtn, styles.utilBtnPurple]}
          onPress={() =>
            router.push(
              `/id-cards?event_id=${eventId}&list_name=${encodeURIComponent(activeList)}&day_number=${activeDay}` as any
            )
          }
        >
          <Ionicons name="card-outline" size={14} color="#c084fc" />
          <Text style={[styles.utilBtnText, { color: '#c084fc' }]}>ID Cards</Text>
        </TouchableOpacity>
      </View>

      {/* Participant List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={CreovatorTheme.colors.primary} />
          <Text style={styles.loadingText}>Loading participants...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredParticipants}
          keyExtractor={(item) => item.id}
          renderItem={renderParticipantItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="people-outline" size={48} color={CreovatorTheme.colors.textDim} />
              <Text style={styles.emptyTitle}>No Participants Yet</Text>
              <Text style={styles.emptySubtitle}>
                Add manually or import an Excel/CSV spreadsheet for {activeList}.
              </Text>
              <CreovatorButton
                title="Add First Participant"
                onPress={() => {
                  resetForm();
                  setAddModalVisible(true);
                }}
                icon={<Ionicons name="add" size={18} color="#ffffff" />}
                style={{ marginTop: 16 }}
              />
            </View>
          }
        />
      )}

      {/* Add Participant Modal */}
      <Modal
        visible={addModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeading}>Add to {activeList}</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <Ionicons name="close" size={22} color={CreovatorTheme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <CreovatorInput
              label="Full Name *"
              placeholder="e.g. Ali Raza"
              value={formName}
              onChangeText={(text) => {
                setFormName(text);
                setFormErrors((e) => ({ ...e, name: '' }));
              }}
              error={formErrors.name}
              leftIcon={<Ionicons name="person-outline" size={16} color={CreovatorTheme.colors.textMuted} />}
            />

            <CreovatorInput
              label="Email (Optional)"
              placeholder="ali@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={formEmail}
              onChangeText={(text) => {
                setFormEmail(text);
                setFormErrors((e) => ({ ...e, email: '' }));
              }}
              error={formErrors.email}
              leftIcon={<Ionicons name="mail-outline" size={16} color={CreovatorTheme.colors.textMuted} />}
            />

            <CreovatorInput
              label="Phone (Optional)"
              placeholder="+92 300 1234567"
              keyboardType="phone-pad"
              value={formPhone}
              onChangeText={setFormPhone}
              leftIcon={<Ionicons name="call-outline" size={16} color={CreovatorTheme.colors.textMuted} />}
            />

            <CreovatorInput
              label="Organization (Optional)"
              placeholder="e.g. NED University, TechCorp"
              value={formOrg}
              onChangeText={setFormOrg}
              leftIcon={<Ionicons name="business-outline" size={16} color={CreovatorTheme.colors.textMuted} />}
            />

            <View style={styles.modalButtonRow}>
              <CreovatorButton
                title="Cancel"
                variant="outline"
                onPress={() => setAddModalVisible(false)}
                style={{ flex: 1 }}
              />
              <CreovatorButton
                title="Add Participant"
                onPress={handleAddParticipant}
                loading={saving}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Participant Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeading}>Edit Participant</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={22} color={CreovatorTheme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <CreovatorInput
              label="Full Name *"
              value={formName}
              onChangeText={(text) => {
                setFormName(text);
                setFormErrors((e) => ({ ...e, name: '' }));
              }}
              error={formErrors.name}
            />

            <CreovatorInput
              label="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={formEmail}
              onChangeText={(text) => {
                setFormEmail(text);
                setFormErrors((e) => ({ ...e, email: '' }));
              }}
              error={formErrors.email}
            />

            <CreovatorInput
              label="Phone"
              keyboardType="phone-pad"
              value={formPhone}
              onChangeText={setFormPhone}
            />

            <CreovatorInput
              label="Organization"
              value={formOrg}
              onChangeText={setFormOrg}
            />

            <View style={styles.modalButtonRow}>
              <CreovatorButton
                title="Cancel"
                variant="outline"
                onPress={() => setEditModalVisible(false)}
                style={{ flex: 1 }}
              />
              <CreovatorButton
                title="Save Changes"
                onPress={handleEditParticipant}
                loading={saving}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Custom List Modal */}
      <Modal
        visible={addListModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAddListModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeading}>Add Custom List</Text>
              <TouchableOpacity onPress={() => setAddListModalVisible(false)}>
                <Ionicons name="close" size={22} color={CreovatorTheme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <CreovatorInput
              label="List Name *"
              placeholder="e.g. VIPs, Speakers, Media, Mentors"
              value={newListName}
              onChangeText={setNewListName}
              leftIcon={<Ionicons name="bookmark-outline" size={16} color={CreovatorTheme.colors.secondary} />}
            />

            <View style={styles.modalButtonRow}>
              <CreovatorButton
                title="Cancel"
                variant="outline"
                onPress={() => setAddListModalVisible(false)}
                style={{ flex: 1 }}
              />
              <CreovatorButton
                title="Create List"
                variant="secondary"
                onPress={handleAddCustomList}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CreovatorTheme.colors.bgDark,
  },
  daysBar: {
    borderBottomWidth: 1,
    borderBottomColor: CreovatorTheme.colors.cardBorder,
    backgroundColor: CreovatorTheme.colors.bgDarker,
  },
  daysContent: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
  },
  dayTab: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  activeDayTab: {
    backgroundColor: CreovatorTheme.colors.primary,
  },
  dayTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: CreovatorTheme.colors.textMuted,
  },
  activeDayTabText: {
    color: '#ffffff',
  },
  listsBar: {
    borderBottomWidth: 1,
    borderBottomColor: CreovatorTheme.colors.cardBorder,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  listsContent: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  listTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: CreovatorTheme.colors.bgCard,
    borderWidth: 1,
    borderColor: CreovatorTheme.colors.cardBorder,
  },
  activeListTab: {
    borderColor: CreovatorTheme.colors.primary,
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
  },
  listTabText: {
    fontSize: 13,
    fontWeight: '800',
    color: CreovatorTheme.colors.textLight,
  },
  activeListTabText: {
    color: '#ffffff',
  },
  addListTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: CreovatorTheme.colors.secondary,
  },
  addListTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: CreovatorTheme.colors.secondary,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  addParticipantBtn: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: CreovatorTheme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  utilityStrip: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexWrap: 'wrap',
  },
  utilBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: CreovatorTheme.colors.cardBorder,
  },
  utilBtnGold: {
    borderColor: 'rgba(249, 187, 30, 0.3)',
    backgroundColor: 'rgba(249, 187, 30, 0.1)',
  },
  utilBtnPurple: {
    borderColor: 'rgba(192, 132, 252, 0.3)',
    backgroundColor: 'rgba(192, 132, 252, 0.1)',
  },
  utilBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: CreovatorTheme.colors.textLight,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  participantCard: {
    marginBottom: 10,
    padding: 14,
  },
  participantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  nameSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  indexPill: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indexText: {
    fontSize: 11,
    fontWeight: '800',
    color: CreovatorTheme.colors.primary,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '800',
    color: CreovatorTheme.colors.textWhite,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  editBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  deleteBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 4,
  },
  detailText: {
    fontSize: 13,
    color: CreovatorTheme.colors.textMuted,
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 6,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  contactText: {
    fontSize: 12,
    color: CreovatorTheme.colors.textLight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: CreovatorTheme.colors.textMuted,
    fontSize: 13,
    marginTop: 8,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: CreovatorTheme.colors.textWhite,
    marginTop: 14,
  },
  emptySubtitle: {
    fontSize: 13,
    color: CreovatorTheme.colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: CreovatorTheme.colors.bgCard,
    borderWidth: 1,
    borderColor: CreovatorTheme.colors.cardBorder,
    borderRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: CreovatorTheme.colors.textWhite,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
});
