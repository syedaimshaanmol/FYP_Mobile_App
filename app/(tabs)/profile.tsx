import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CreovatorColors } from '../../constants/theme';
import { CreovatorHeader } from '../../components/creovator/CreovatorHeader';
import { CreovatorCard } from '../../components/creovator/CreovatorCard';
import { CreovatorButton } from '../../components/creovator/CreovatorButton';
import { supabase } from '../../lib/supabase';

interface UserProfileData {
  id: string;
  email: string;
  full_name: string;
  bio: string;
  phone: string;
  location: string;
  avatar_url: string | null;
}

export default function ProfileTab() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfileData>({
    id: '',
    email: '',
    full_name: '',
    bio: '',
    phone: '',
    location: '',
    avatar_url: null,
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login-selection');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setProfile({
        id: user.id,
        email: user.email || '',
        full_name: data?.full_name || user.user_metadata?.full_name || '',
        bio: data?.bio || '',
        phone: data?.phone || '',
        location: data?.location || '',
        avatar_url: data?.avatar_url || null,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePickAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        const localUri = result.assets[0].uri;
        setProfile(prev => ({ ...prev, avatar_url: localUri }));

        // Upload to Supabase avatars bucket
        const fileName = `${profile.id}/avatar_${Date.now()}.jpg`;
        const response = await fetch(localUri);
        const blob = await response.blob();

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, blob, { upsert: true, contentType: 'image/jpeg' });

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
          const remoteUrl = publicUrlData.publicUrl;
          await supabase.from('profiles').update({ avatar_url: remoteUrl }).eq('id', profile.id);
          setProfile(prev => ({ ...prev, avatar_url: remoteUrl }));
        }
      }
    } catch (err: any) {
      Alert.alert('Notice', 'Image selection completed.');
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name.trim(),
          bio: profile.bio.trim(),
          phone: profile.phone.trim(),
          location: profile.location.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) throw error;
      Alert.alert('Success', 'Profile information updated successfully!');
    } catch (err: any) {
      Alert.alert('Save Failed', err.message || 'Could not update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of Creovator?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            router.replace('/login-selection');
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={CreovatorColors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CreovatorHeader
        title="Organizer Profile"
        rightIcon="logout"
        onRightPress={handleSignOut}
      />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Avatar & Header Card */}
        <CreovatorCard style={styles.profileHeroCard}>
          <View style={styles.avatarWrapper}>
            {profile.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>
                  {(profile.full_name || profile.email || 'C').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <TouchableOpacity style={styles.cameraBadge} onPress={handlePickAvatar}>
              <MaterialCommunityIcons name="camera" size={16} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>{profile.full_name || 'Event Organizer'}</Text>
          <Text style={styles.userEmail}>{profile.email}</Text>

          <View style={styles.proBadge}>
            <MaterialCommunityIcons name="shield-check" size={14} color={CreovatorColors.accentGold} />
            <Text style={styles.proBadgeText}>Creovator Pro Member</Text>
          </View>
        </CreovatorCard>

        {/* Subscription / Plan Card */}
        <CreovatorCard style={styles.planCard}>
          <View style={styles.planRow}>
            <View style={styles.planIconWrap}>
              <MaterialCommunityIcons name="crown" size={24} color={CreovatorColors.accentGold} />
            </View>
            <View style={styles.planTextWrap}>
              <Text style={styles.planTitle}>Creovator Pro Plan</Text>
              <Text style={styles.planSub}>Unlimited events, AI copywriter, and certificates</Text>
            </View>
            <TouchableOpacity
              style={styles.planUpgradeBtn}
              onPress={() => router.push('/payment')}
            >
              <Text style={styles.planUpgradeText}>Upgrade</Text>
            </TouchableOpacity>
          </View>
        </CreovatorCard>

        {/* Edit Form */}
        <CreovatorCard style={styles.formCard}>
          <Text style={styles.sectionHeading}>ORGANIZER DETAILS</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={profile.full_name}
              onChangeText={val => setProfile(prev => ({ ...prev, full_name: val }))}
              placeholder="e.g. Sarah Jenkins"
              placeholderTextColor={CreovatorColors.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Bio / Organization</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={profile.bio}
              onChangeText={val => setProfile(prev => ({ ...prev, bio: val }))}
              placeholder="Tell attendees about yourself or your organization..."
              placeholderTextColor={CreovatorColors.textMuted}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={profile.phone}
              onChangeText={val => setProfile(prev => ({ ...prev, phone: val }))}
              placeholder="e.g. +92 300 1234567"
              placeholderTextColor={CreovatorColors.textMuted}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Location / City</Text>
            <TextInput
              style={styles.input}
              value={profile.location}
              onChangeText={val => setProfile(prev => ({ ...prev, location: val }))}
              placeholder="e.g. Karachi, Pakistan"
              placeholderTextColor={CreovatorColors.textMuted}
            />
          </View>

          <CreovatorButton
            title="Save Profile"
            icon="check"
            loading={saving}
            onPress={handleSaveProfile}
            style={{ marginTop: 12 }}
          />
        </CreovatorCard>

        {/* Account Actions */}
        <View style={styles.dangerZone}>
          <TouchableOpacity style={styles.logoutFullBtn} onPress={handleSignOut}>
            <MaterialCommunityIcons name="logout-variant" size={20} color={CreovatorColors.error} />
            <Text style={styles.logoutFullText}>Sign Out of Creovator</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CreovatorColors.bgDark,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  profileHeroCard: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 14,
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: CreovatorColors.primary,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: CreovatorColors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: CreovatorColors.primary,
  },
  avatarInitial: {
    color: CreovatorColors.accentGold,
    fontSize: 34,
    fontWeight: '800',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: CreovatorColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: CreovatorColors.bgDark,
  },
  userName: {
    color: CreovatorColors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  userEmail: {
    color: CreovatorColors.textMuted,
    fontSize: 13,
    marginBottom: 12,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(249, 187, 30, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(249, 187, 30, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
  },
  proBadgeText: {
    color: CreovatorColors.accentGold,
    fontSize: 12,
    fontWeight: '700',
  },
  planCard: {
    padding: 16,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderColor: 'rgba(99, 102, 241, 0.25)',
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(249, 187, 30, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  planTextWrap: {
    flex: 1,
    marginRight: 8,
  },
  planTitle: {
    color: CreovatorColors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  planSub: {
    color: CreovatorColors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  planUpgradeBtn: {
    backgroundColor: CreovatorColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  planUpgradeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  formCard: {
    padding: 16,
    gap: 14,
  },
  sectionHeading: {
    color: CreovatorColors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    color: CreovatorColors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    backgroundColor: CreovatorColors.surfaceDark,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: CreovatorColors.borderDark,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: CreovatorColors.textPrimary,
    fontSize: 14,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  dangerZone: {
    marginTop: 8,
  },
  logoutFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingVertical: 14,
  },
  logoutFullText: {
    color: CreovatorColors.error,
    fontSize: 14,
    fontWeight: '700',
  },
});

