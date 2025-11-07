import * as mongoose from 'mongoose';

mongoose.pluralize(null);
const zogsooliinUneSchema = new mongoose.Schema(
    {
        udur: [String],
        unenuud: [
            {
                minut: Number, //minut xurtel dun
                une: Number,
            },
        ],
        undsenUne: Number, //tsagiin tariff
        baiguullagiinId: String,
        zogsooliinId: String,
    },
    {
        timestamps: true,
    }
);

export default function a(conn: any) {
    if (!conn || !conn.kholbolt)
        throw new Error("Холболтын мэдээлэл заавал бөглөх шаардлагатай!");
    conn = conn.kholbolt;
    return conn.model("ZogsooliinUne", zogsooliinUneSchema);
};
