import * as mongoose from 'mongoose';

mongoose.pluralize(null);
const parkingSchema = new mongoose.Schema(
  {
    ner: String,
    tokiNer: String, // toki ashiglax ued buglux
    tokiBolonStickerAshiglakhEsekh: Boolean, // toki ashiglakh esekh
    passNer: String, // pass parking ashiglax ued buglux
    kamerDavkharAshiglakh: Boolean, //orox kamera-g 2 zogsool deer ashiglana
    uneguiMashinNeekhgui: Boolean, //khalmon zoriulsan
    gadnaZogsooliinId: String,
    dotorZogsooliinId: String, //gadna zogsooliinId-g xereglene, xariltsan buglux zorilgoor oruulaw
    baiguullagiinId: String,
    barilgiinId: String,
    khugatsaa: Number,
    qrKhungulukhDun: Number,
    orokhKhaalgaGarTokhirgoo: Boolean, //zaaval garaas ongoilgoh darj ongoilgokh esekh tokhirgoo
    garakhKhaalgaGarTokhirgoo: Boolean, //zaaval garaas ongoilgoh darj ongoilgokh esekh tokhirgoo
    zurchilZaavalBurtgekhEsekh: Boolean, //mashin gargakh ued zurchil zaaval garaas burtgekh esekh tokhirgoo
    zogsoolTooKhyazgaarlakhEsekh: Boolean, //mashin orokh ued zogsool duursen esekh shalgakh tokhirgoo
    zogsoolKhuleekhMashinEsekh: Boolean, //zogsool duusen ued khueelgiin gorimd oruulakh esekh tokhirgoo
    davkharGarakhUnshilt: Boolean, // davkhar garakh kamert unshuulakh
    zurchulMsgeerSanuulakh: Boolean /** Зогсоолын зөрчил сануулах тохируулах */,
    zurchilTootsojEkhlekhOgnoo: Date /** Зогсоолын зөрчил сануулах зөрчил тооцож эхлэх огноо тохируулах */,
    tulburiinLimitDun: Number /** Зогсоолын зөрчил сануулах төлбөрийн лимит тохируулах */,
    zurchilMsgilgeekhDugaar: [String] /** Зогсоолын зөрчил мессеж илгээх дугаар */,
    dotorZogsoolShuudGarakh: Boolean, //zogsool GTHub shuud dotroos garakh uyd ashiglakh
    too: Number,
    zogsooliinDans: String, //Tukhain zoglooliin tulbur avakh dans
    zogsooliinDansSticker: String, //Tukhain zoglooliin tulbur avakh dans sticker
    garakhTsag: Number, //Tukhain mashinii zogsooloos garakh yostoi tsag minutaar
    mashinGargakhKhugatsaa: Number, //todorxoigui tuluwtei mashinig tsewerlex xugatsaa
    mashinUstgakhKhugatsaa: Number, //baazaas ustgax xonog
    barilgaTusBur: Boolean,
    uneguiOrokhCameraIP: String,
    togtmolTulburEsekh: Boolean,
    togtmolTulburiinDun: Number,
    gadaaStickerAshiglakhEsekh: Boolean /** gadaa sticker ashiglakh esekh */,
    undsenUne: Number, //default tsag tariff
    undsenMin: {
      type: Boolean,
      default: false,
    },
    tokhirgoo: mongoose.Schema.Types.Mixed,
    tulburuud: [
      {
        tariff: [
          {
            minut: Number, //minut xurtel dun
            tulbur: Number,
          },
        ],
        tsag: [Date],
      },
    ],
    khaalga: [
      {
        ner: String,
        turul: String,
        camera: [
          {
            cameraIP: String,
            tokhirgoo: mongoose.Schema.Types.Mixed,
          },
        ],
      },
    ],
  },
  {
    timestamps: true,
  },
);

export default function a(conn: any) {
  if (!conn || !conn.kholbolt) throw new Error('Холболтын мэдээлэл заавал бөглөх шаардлагатай!');
  conn = conn.kholbolt;
  return conn.model('Parking', parkingSchema);
}
