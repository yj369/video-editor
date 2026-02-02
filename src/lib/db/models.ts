import { Schema, model, models } from 'mongoose';

const EditorStateSchema = new Schema({
  projectId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  version: Number,
  savedAt: Number,
  themeMode: String,
  config: Schema.Types.Mixed,
  scriptData: Schema.Types.Mixed,
  tracks: Schema.Types.Mixed,
  layerClips: Schema.Types.Mixed,
  markers: Schema.Types.Mixed,
  selectedClipIds: [String],
  selectedMarkerId: String,
  activeTab: String,
  gridDirection: String,
  exportPreset: String,
  inputText: String,
  isSRTMode: Boolean,
  activeSubtitleStyle: String,
  activeCutoutStyle: String,
  activeBrollStyle: String,
  activeMotionStyle: String,
}, {
  timestamps: true,
});

export const EditorState = models.EditorState || model('EditorState', EditorStateSchema);
