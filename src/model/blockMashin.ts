import * as mongoose from 'mongoose';

mongoose.pluralize(null);
const blockMashinSchema = new mongoose.Schema(
  {
    baiguullagiinId: String,
    barilgiinId: String,
    dugaar: String,
    tailbar: String,
    burtgesenAjiltaniiId: String,
    burtgesenAjiltaniiNer: String,
  },
  {
    timestamps: true,
  },
);

export default function a(conn: any) {
  if (!conn || !conn.kholbolt) throw new Error('Холболтын мэдээлэл заавал бөглөх шаардлагатай!');
  conn = conn.kholbolt;
  return conn.model('BlockMashin', blockMashinSchema);
}
