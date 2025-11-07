import * as mongoose from 'mongoose';

mongoose.pluralize(null);
const zogsooliinTulburSchema = new mongoose.Schema(
    {
        ognoo: Date,
        turul: String,
        khariu: mongoose.Schema.Types.Mixed,
        zogsooliinId: String,
        tailbar: String,
        msg: String,
        dun: Number,
        baiguullagiinId: String,
        barilgiinId: String,
    },
    {
        timestamps: true,
    }
);

export default function a(conn: any) {
    if (!conn || !conn.kholbolt)
        throw new Error("Холболтын мэдээлэл заавал бөглөх шаардлагатай!");
    conn = conn.kholbolt;
    return conn.model("ZogsooliinTulbur", zogsooliinTulburSchema);
};
