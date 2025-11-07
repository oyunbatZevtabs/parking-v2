import * as mongoose from 'mongoose';

mongoose.pluralize(null);
const zurchilteiMashinSchema = new mongoose.Schema(
  {
    baiguullagiinId: String,
    barilgiinId: String,
    uilchluulegchiinId: String,
    zogsooliinId: String,
    mashiniiDugaar: String,
    niitKhugatsaa: Number,
    orsonKhaalga: String,
    garsanKhaalga: String,
    turul: String,
    tailbar: String,
    orsonTsag: Date,
    garsanTsag: Date,
    niitDun: {
      type: Number,
      default: 0,
    },
    tuluv: {
      type: Number, // 1 төлсөн, 0 төлөөгүй
      default: 0,
    },
    ebarimtAvakhDun: Number,
    ebarimtRegister: String,
    ebarimtAvsanEsekh: Boolean,
    ebarimtAvsanDun: Number,
  },
  {
    timestamps: true,
  },
);

export default function a(conn: any) {
  if (!conn || !conn.kholbolt) throw new Error('Холболтын мэдээлэл заавал бөглөх шаардлагатай!');
  conn = conn.kholbolt;
  return conn.model('ZurchilteiMashin', zurchilteiMashinSchema);
}
