import * as mongoose from 'mongoose';

mongoose.pluralize(null);
const uilchluulegchSchema = new mongoose.Schema(
  {
    mashiniiDugaar: String,
    tuukh: [
      {
        tsagiinTuukh: [
          {
            orsonTsag: Date,
            garsanTsag: Date,
          },
        ],
        niitKhugatsaa: Number, //minutaar
        zogsooliinId: String,
        burtgesenAjiltaniiId: String,
        burtgesenAjiltaniiNer: String,
        undsenUne: Number,
        tulukhDun: Number,
        uneguiGarsan: String,
        orsonKhaalga: String,
        garsanKhaalga: String,
        tulbur: [
          {
            khariu: mongoose.Schema.Types.Mixed,
            ognoo: Date,
            turul: String,
            dun: Number,
          },
        ],
        tuluv: {
          type: Number, // 1 төлсөн, -1 үнэгүй гарсан, -2 зөрчилтэй
          default: 0,
        },
      },
    ],
    niitDun: {
      type: Number,
      default: 0,
    },
    niitKhugatsaa: Number,
    ebarimtAvakhDun: Number,
    ebarimtRegister: String,
    ebarimtAvsanEsekh: Boolean,
    ebarimtAvsanDun: Number,
    zurchil: String,
    turul: String,
    baiguullagiinId: String,
    barilgiinId: String,
    tokiId: String,
    mashin: mongoose.Schema.Types.Mixed,
    urisanMashin: mongoose.Schema.Types.Mixed,
    garakhTsag: Date, // uridchilj tulburuu tulsun ued garax yostoi tsag
    freezeOgnoo: Date, // toki ued tulburiig tur xugatsaand xulduux
  },
  {
    timestamps: true,
  },
);

export default function a(conn: any, read: boolean = false) {
  if (!conn || !conn.kholbolt) throw new Error('Холболтын мэдээлэл заавал бөглөх шаардлагатай!');
  conn = read && !!conn.kholboltRead ? conn.kholboltRead : conn.kholbolt;
  return conn.model('Uilchluulegch', uilchluulegchSchema);
}
