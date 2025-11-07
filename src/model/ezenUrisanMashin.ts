import * as mongoose from 'mongoose';

mongoose.pluralize(null);
const ezenUrisanMashinSchema = new mongoose.Schema(
  {
    baiguullagiinId: String,
    barilgiinId: String,
    davtamjiinTurul: String,
    tusBurUneguiMinut: Number,
    tusBurAshiglasanUneguiMinut: Number,
    tusBurAshiglasanUneguiMinutNiit: Number,
    ezemshigchiinId: String,
    ezemshigchiinNer: String,
    ezemshigchiinRegister: String,
    ezemshigchiinUtas: String,
    urisanMashiniiDugaar: String,
    tuluv: Number,
  },
  {
    timestamps: true,
  },
);

export default function a(conn: any) {
  if (!conn || !conn.kholbolt) throw new Error('Холболтын мэдээлэл заавал бөглөх шаардлагатай!');
  conn = conn.kholbolt;
  return conn.model('ezenUrisanMashin', ezenUrisanMashinSchema);
}
