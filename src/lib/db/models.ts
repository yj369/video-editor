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

const AssetSchema = new Schema({
  projectId: {
    type: String,
    required: true,
    index: true,
  },
  assetId: {
    type: String,
    required: true,
    index: true, 
  },
  name: String,
  type: String,
  size: Number,
  data: String, // Base64 string
  createdAt: Number,
}, {
  timestamps: true,
});

// Composite index to ensure unique assetId per project
AssetSchema.index({ projectId: 1, assetId: 1 }, { unique: true });

export const Asset = models.Asset || model('Asset', AssetSchema);