import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useResponsive } from '@/constants/useResponsive';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CreovatorButton } from '../../components/creovator/CreovatorButton';
import { CreovatorCard } from '../../components/creovator/CreovatorCard';
import { CreovatorHeader } from '../../components/creovator/CreovatorHeader';
import { DesignTemplate, getTemplateById } from '../../constants/designTemplates';
import { CreovatorColors } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');
const CANVAS_WIDTH = width - 32;

interface EditableItem {
  id: string;
  type: string;
  text?: string;
  fill?: string;
  fontSize?: number;
  fontWeight?: string;
}

export default function DesignEditorScreen() {
  const router = useRouter();
  const r = useResponsive();
  const params = useLocalSearchParams<{ template_id?: string; design_id?: string; event_id?: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [designTitle, setDesignTitle] = useState('My Custom Design');
  const [template, setTemplate] = useState<DesignTemplate | null>(null);
  const [bgColor, setBgColor] = useState('#0f172a');
  const [elements, setElements] = useState<EditableItem[]>([]);
  const [selectedElId, setSelectedElId] = useState<string | null>(null);

  // Inspector edit state
  const [editText, setEditText] = useState('');
  const [editFill, setEditFill] = useState('#ffffff');
  const [editSize, setEditSize] = useState(18);

  useEffect(() => {
    loadDesign();
  }, [params.template_id, params.design_id]);

  const loadDesign = async () => {
    setLoading(true);
    try {
      if (params.design_id) {
        const { data, error } = await supabase
          .from('designs')
          .select('*')
          .eq('id', params.design_id)
          .single();

        if (!error && data) {
          setDesignTitle(data.name || 'Saved Design');
          const canvasJson = data.canvas_json;
          setBgColor(canvasJson?.background || '#0f172a');
          const parsedElements: EditableItem[] = (canvasJson?.objects || []).map((o: any, idx: number) => ({
            id: `obj-${idx}`,
            type: o.type || 'textbox',
            text: o.text || '',
            fill: o.fill || '#ffffff',
            fontSize: o.fontSize || 16,
            fontWeight: o.fontWeight || 'normal',
          }));
          setElements(parsedElements);
          if (parsedElements.length > 0) {
            selectElement(parsedElements[0]);
          }
        }
      } else if (params.template_id) {
        const tpl = getTemplateById(params.template_id);
        if (tpl) {
          setTemplate(tpl);
          setDesignTitle(tpl.name);
          setBgColor(tpl.json.background || '#0f172a');
          const textObjects: EditableItem[] = tpl.json.objects
            .filter((o: any) => o.type === 'textbox' || o.text)
            .map((o: any, idx: number) => ({
              id: `obj-${idx}`,
              type: o.type,
              text: o.text || '',
              fill: o.fill || '#ffffff',
              fontSize: o.fontSize || 16,
              fontWeight: o.fontWeight || 'normal',
            }));
          setElements(textObjects);
          if (textObjects.length > 0) {
            selectElement(textObjects[0]);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectElement = (el: EditableItem) => {
    setSelectedElId(el.id);
    setEditText(el.text || '');
    setEditFill(el.fill || '#ffffff');
    setEditSize(el.fontSize || 16);
  };

  const updateSelectedElement = (newText: string, newColor: string, newSize: number) => {
    setElements(prev =>
      prev.map(el =>
        el.id === selectedElId
          ? { ...el, text: newText, fill: newColor, fontSize: newSize }
          : el
      )
    );
  };

  const addTextElement = () => {
    const newEl: EditableItem = {
      id: `obj-${Date.now()}`,
      type: 'textbox',
      text: 'New Event Headline',
      fill: CreovatorColors.accentGold,
      fontSize: 20,
      fontWeight: 'bold',
    };
    setElements(prev => [...prev, newEl]);
    selectElement(newEl);
  };

  const deleteSelectedElement = () => {
    if (!selectedElId) return;
    const remaining = elements.filter(el => el.id !== selectedElId);
    setElements(remaining);
    if (remaining.length > 0) {
      selectElement(remaining[0]);
    } else {
      setSelectedElId(null);
    }
  };

  const handleSaveDesign = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Auth Required', 'Please log in to save your design.');
        return;
      }

      const canvasPayload = {
        background: bgColor,
        objects: elements.map(el => ({
          type: el.type,
          text: el.text,
          fill: el.fill,
          fontSize: el.fontSize,
          fontWeight: el.fontWeight,
        })),
      };

      if (params.design_id) {
        const { error } = await supabase
          .from('designs')
          .update({
            name: designTitle,
            canvas_json: canvasPayload,
            updated_at: new Date().toISOString(),
          })
          .eq('id', params.design_id);

        if (error) throw error;
        Alert.alert('Saved', 'Design updated successfully!');
      } else {
        const { error } = await supabase.from('designs').insert({
          user_id: user.id,
          name: designTitle,
          category: template?.category || 'tech',
          template_id: template?.id || 'custom',
          event_id: params.event_id || null,
          canvas_json: canvasPayload,
        });

        if (error) throw error;
        Alert.alert('Success', 'Design saved to My Designs!', [
          { text: 'View My Designs', onPress: () => router.push('/design-studio/my-designs') },
          { text: 'Keep Editing' },
        ]);
      }
    } catch (err: any) {
      Alert.alert('Error Saving', err.message || 'Could not save design.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={CreovatorColors.primary} />
      </View>
    );
  }

  const selectedEl = elements.find(el => el.id === selectedElId);

  return (
    <View style={styles.container}>
      <CreovatorHeader
        title="Visual Editor"
        showBack
        onBackPress={() => router.back()}
        rightIcon="content-save-outline"
        onRightPress={handleSaveDesign}
      />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Title Input */}
        <TextInput
          style={styles.titleInput}
          value={designTitle}
          onChangeText={setDesignTitle}
          placeholder="Design Title"
          placeholderTextColor={CreovatorColors.textMuted}
        />

        {/* Canvas Display View */}
        <View style={[styles.canvasCard, { backgroundColor: bgColor }]}>
          {/* Top Decorative bar */}
          <View style={styles.canvasAccentBar} />

          <View style={styles.canvasObjectsContainer}>
            {elements.map(el => {
              const isSelected = el.id === selectedElId;
              return (
                <TouchableOpacity
                  key={el.id}
                  style={[styles.canvasTextRow, isSelected && styles.canvasTextRowActive]}
                  onPress={() => selectElement(el)}
                >
                  <Text
                    style={{
                      color: el.fill || '#fff',
                      fontSize: Math.min(el.fontSize || 16, 24),
                      fontWeight: (el.fontWeight as any) || 'normal',
                      textAlign: 'center',
                    }}
                  >
                    {el.text}
                  </Text>
                  {isSelected && (
                    <View style={styles.activeSelectionDot} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.watermark}>
            <Text style={styles.watermarkText}>Designed with Creovator</Text>
          </View>
        </View>

        {/* Toolbar Controls */}
        <View style={styles.toolbarRow}>
          <TouchableOpacity style={styles.toolBtn} onPress={addTextElement}>
            <MaterialCommunityIcons name="format-text" size={18} color={CreovatorColors.textPrimary} />
            <Text style={styles.toolBtnText}>Add Text</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolBtn, !selectedElId && styles.toolBtnDisabled]}
            onPress={deleteSelectedElement}
            disabled={!selectedElId}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={18} color={CreovatorColors.error} />
            <Text style={[styles.toolBtnText, { color: CreovatorColors.error }]}>Delete</Text>
          </TouchableOpacity>
        </View>

        {/* Inspector Panel */}
        {selectedEl && (
          <CreovatorCard style={styles.inspectorCard}>
            <Text style={styles.inspectorTitle}>EDIT ELEMENT</Text>

            <Text style={styles.fieldLabel}>Text Content</Text>
            <TextInput
              style={styles.textInput}
              value={editText}
              onChangeText={val => {
                setEditText(val);
                updateSelectedElement(val, editFill, editSize);
              }}
              multiline
            />

            <View style={styles.colorRow}>
              <Text style={styles.fieldLabel}>Text Color</Text>
              <View style={styles.colorPills}>
                {['#ffffff', '#f9bb1e', '#22d3ee', '#6366f1', '#ec4899', '#10b981', '#000000'].map(
                  hex => (
                    <TouchableOpacity
                      key={hex}
                      style={[
                        styles.colorCircle,
                        { backgroundColor: hex },
                        editFill === hex && styles.colorCircleActive,
                      ]}
                      onPress={() => {
                        setEditFill(hex);
                        updateSelectedElement(editText, hex, editSize);
                      }}
                    />
                  )
                )}
              </View>
            </View>

            {/* Font Size Stepper */}
            <View style={styles.stepperRow}>
              <Text style={styles.fieldLabel}>Font Size ({editSize}px)</Text>
              <View style={styles.stepperActions}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => {
                    const next = Math.max(editSize - 2, 10);
                    setEditSize(next);
                    updateSelectedElement(editText, editFill, next);
                  }}
                >
                  <MaterialCommunityIcons name="minus" size={16} color={CreovatorColors.textPrimary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => {
                    const next = Math.min(editSize + 2, 48);
                    setEditSize(next);
                    updateSelectedElement(editText, editFill, next);
                  }}
                >
                  <MaterialCommunityIcons name="plus" size={16} color={CreovatorColors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>
          </CreovatorCard>
        )}

        {/* Save Button */}
        <View style={styles.saveContainer}>
          <CreovatorButton
            title="Save Design"
            icon="content-save"
            loading={saving}
            onPress={handleSaveDesign}
          />
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
  },
  titleInput: {
    color: CreovatorColors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    backgroundColor: CreovatorColors.surfaceDark,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: CreovatorColors.borderDark,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  canvasCard: {
    width: CANVAS_WIDTH,
    minHeight: 280,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CreovatorColors.borderDark,
    padding: 16,
    justifyContent: 'space-between',
    marginBottom: 16,
    overflow: 'hidden',
  },
  canvasAccentBar: {
    height: 4,
    width: '40%',
    backgroundColor: CreovatorColors.primary,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  canvasObjectsContainer: {
    gap: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  canvasTextRow: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    position: 'relative',
    minWidth: 120,
  },
  canvasTextRowActive: {
    borderColor: CreovatorColors.primaryLight,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  activeSelectionDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: CreovatorColors.accentGold,
  },
  watermark: {
    alignSelf: 'center',
    marginTop: 16,
  },
  watermarkText: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  toolbarRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: CreovatorColors.surfaceDark,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: CreovatorColors.borderDark,
  },
  toolBtnDisabled: {
    opacity: 0.4,
  },
  toolBtnText: {
    color: CreovatorColors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  inspectorCard: {
    padding: 16,
    gap: 12,
    marginBottom: 20,
  },
  inspectorTitle: {
    color: CreovatorColors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  fieldLabel: {
    color: CreovatorColors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: CreovatorColors.surfaceDark,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: CreovatorColors.borderDark,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: CreovatorColors.textPrimary,
    fontSize: 14,
  },
  colorRow: {
    gap: 8,
  },
  colorPills: {
    flexDirection: 'row',
    gap: 10,
  },
  colorCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorCircleActive: {
    borderColor: CreovatorColors.accentGold,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  stepperActions: {
    flexDirection: 'row',
    gap: 8,
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: CreovatorColors.surfaceDark,
    borderWidth: 1,
    borderColor: CreovatorColors.borderDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveContainer: {
    marginTop: 10,
  },
});

