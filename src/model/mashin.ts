import * as mongoose from 'mongoose';

mongoose.pluralize(null);
const mashinSchema = new mongoose.Schema(
  {
    id: String,
    baiguullagiinId: String,
    barilgiinId: String,
    turul: String,
    tuluv: String,
    nemeltTuluv: String,
    khungulultTurul: String,
    khungulult: String,
    tsagiinTurul: String,
    zogsooliinTurul: String,
    khungulukhKhugatsaa: Number,
    khungulujEkhlesenOgnoo: Date,
    uldegdelKhungulukhKhugatsaa: Number,
    dugaar: String,
    temdeglel: String,
    kharJagsaalt: Boolean,
    ezemshigchiinId: String,
    ezemshigchiinNer: String,
    ezemshigchiinRegister: String,
    ezemshigchiinUtas: String,
    ezemshigchiinTalbainDugaar: String,
    gereeniiDugaar: String,
    tuukh: mongoose.Schema.Types.Mixed,
    ekhlekhOgnoo: Date,
    duusakhOgnoo: Date,
    gereeniiId: String,
    khariltsagchiinNer: String,
    cameraIP: String,
    gereetTulburBodokhEsekh: Boolean, //gereet mashind tulbur bodokh esekh
    tulburBodokhTsagEkhlekh: String, //tulbur bodoj ekhlekh - duusakh tsag
    tulburBodokhTsagDuusakh: String,
    tulburBodokhTsagEkhlekhNeg: String, //nemelt ued buglux
    tulburBodokhTsagDuusakhNeg: String,
    dugaarUurchilsunOgnoo: Date,
    dugaarDuusakhOgnoo: Date,
    tsenegleltUldegdel: Number, //uridchilj mungu tulj bui mashinii uldegdel
    burtgesenAjiltaniiId: String,
    burtgesenAjiltaniiNer: String,
    mashinuud: [String],
    tsenegleltTuukh: [
      {
        ognoo: Date,
        dun: Number,
        turul: {
          type: String,
          enum: ['orlogo', 'zarlaga'],
        },
        uldegdel: Number,
      },
    ], //uridchilj mungu tulj bui mashinii uldegdel
  },
  {
    timestamps: true,
  },
);

export default function a(conn: any) {
  if (!conn || !conn.kholbolt) throw new Error('Холболтын мэдээлэл заавал бөглөх шаардлагатай!');
  conn = conn.kholbolt;
  return conn.model('Mashin', mashinSchema);
}
