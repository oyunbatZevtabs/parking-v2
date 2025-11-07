import Parking from '../model/parking';
import Uilchluulegch from '../model/uilchluulegch';
import ZurchilteiMashin from '../model/zurchilteiMashin';
import BlockMashin from '../model/blockMashin';
import Mashin from '../model/mashin';
import EzenUrisanMashin from '../model/ezenUrisanMashin';
import TokiMashin from '../model/tokiMashin';
import * as moment from 'moment';
import { Token } from 'zevbackv2';
const axios = require('axios');

export async function sdkData(req: any, callback: any) {
  try {
    const body: any = req.body;
    var val = body.mashiniiDugaar?.match(new RegExp('[0-9]{4}[А-Я|а-я|ө|Ө|ү|Ү]{3}', 'i'));
    if (
      !!body.mashiniiDugaar &&
      ((body.baiguullagiinId === '6715ef2ca5cefb3e54505428' && !!val) ||
        body?.baiguullagiinId !== '6715ef2ca5cefb3e54505428')
    ) {
      if (!body.CAMERA_IP && body.camerA_IP) body.CAMERA_IP = body.camerA_IP;
      var odoo = new Date();
      body.check_in_time = new Date();
      body.check_out_time = new Date();
      const mathchMashin: any = {
        dugaar: body.mashiniiDugaar,
      };
      const matchOlonMashin: any = {
        mashinuud: { $in: [body.mashiniiDugaar] }
      };
      const queryParking: any = {
        'khaalga.camera.cameraIP': body.CAMERA_IP,
      };
      if (!!body.barilgiinId) queryParking['barilgiinId'] = body.barilgiinId;
      var zogsooluud = await (Parking as any)(body.tukhainBaaziinKholbolt).find(queryParking);
      var zogsool: any = {};
      if (zogsooluud.length > 0) {
        zogsool = zogsooluud[0];
      }
      if (zogsool.barilgaTusBur) 
      {
        mathchMashin['barilgiinId'] = zogsool.barilgiinId;
        matchOlonMashin['barilgiinId'] = zogsool.barilgiinId;
      }
      var nemeltZogsool = null;
      var tokiUilchluulegch = null; //toki ued GThub 2 zogsooliin negiig bugluxud zoriulj uusgelee
      if (!!zogsool.kamerDavkharAshiglakh) {
        nemeltZogsool = await (Parking as any)(body.tukhainBaaziinKholbolt).findOne({
          _id: { $ne: zogsool._id },
        });
        if (!!nemeltZogsool.tokiNer)
          tokiUilchluulegch = await (Uilchluulegch as any)(body.tukhainBaaziinKholbolt).findOne({
            mashiniiDugaar: body.mashiniiDugaar,
            'tuukh.zogsooliinId': nemeltZogsool._id.toString(),
            'tuukh.0.tsagiinTuukh.0.garsanTsag': {
              $exists: false,
            },
            'tuukh.0.tuluv': {
              $ne: -2,
            },
          });
      }

      const query = [
        {
          $match: {
            createdAt: {
              $gte: new Date(moment().startOf('day').format('YYYY-MM-DD 00:00:00')),
              $lte: new Date(moment().endOf('day').format('YYYY-MM-DD 23:59:59')),
            },
            baiguullagiinId: zogsool.baiguullagiinId,
            barilgiinId: zogsool.barilgiinId,
          },
        },
        {
          $unwind: { path: '$tuukh' },
        },
        {
          $match: {
            'tuukh.zogsooliinId': zogsool._id.toString(),
            'tuukh.tsagiinTuukh': { $exists: true, $not: { $size: 0 } },
            'tuukh.garsanKhaalga': {
              $exists: false,
            },
          },
        },
        {
          $group: {
            _id: {
              id: 'aa',
              zogsool: '$tuukh.zogsooliinId',
            },
            too: {
              $sum: 1,
            },
          },
        },
      ];
      const zogsoolResult: any = await (Uilchluulegch as any)(body.tukhainBaaziinKholbolt).aggregate(query);
      var sulToo = (zogsool.too || 0) - (zogsoolResult?.length > 0 ? zogsoolResult[0].too : 0);

      const khaalga = await zogsool.khaalga.find((a: any) => a.camera.find((b: any) => b.cameraIP === body.CAMERA_IP));
      const io = req.app.get('socketio');
      if (khaalga.turul === 'Гарах') {
        const uilchluulegch: any = await (Uilchluulegch as any)(body.tukhainBaaziinKholbolt).findOne({
          mashiniiDugaar: body.mashiniiDugaar,
          'tuukh.zogsooliinId':
            zogsool.dotorZogsoolShuudGarakh && !!zogsool?.gadnaZogsooliinId
              ? zogsool?.gadnaZogsooliinId.toString()
              : zogsool._id.toString(),
          'tuukh.0.tsagiinTuukh.0.garsanTsag': {
            $exists: false,
          },
          'tuukh.0.tuluv': {
            $ne: -2,
          },
        }); //HAMGIIN SUULIINH NI BAIH

        const mashin: any = await (Mashin as any)(body.tukhainBaaziinKholbolt).findOne({
          dugaar: body.mashiniiDugaar,
          turul: { $in: ['Дотоод', 'Үнэгүй', 'СӨХ'] },
          barilgiinId: zogsool.barilgiinId,
        });
        if (!!mashin && mashin?.turul !== 'СӨХ')
          io.emit(`zogsool${zogsool.baiguullagiinId}`, { khaalgaTurul: 'oroh', cameraIP: body.CAMERA_IP });
        if (!!uilchluulegch) {
          const freeze = new Date(uilchluulegch.freezeOgnoo);
          const freezePlus = new Date(freeze.getTime() + (zogsool?.garakhTsag || 30) * 60000);
          if (!isNaN(freeze.getTime()) && freezePlus > new Date()) {
            odoo = freeze;
          }
          let dun = 0;
          let dotorZogsoolMinut = 0;
          if (!zogsool?.gadnaZogsooliinId && uilchluulegch.tuukh && uilchluulegch.tuukh.length > 1) {
            for await (const object of uilchluulegch.tuukh) {
              dotorZogsoolMinut = dotorZogsoolMinut + (object.niitKhugatsaa ? object.niitKhugatsaa : 0);
            }
          }
          if (uilchluulegch?.tuukh?.length > 1) {
            uilchluulegch.tuukh.reverse();
          }
          if (body.baiguullagiinId === '63c0f31efe522048bf02086d' && !!zogsool?.gadnaZogsooliinId)
            uilchluulegch.niitDun = 0;
          for await (const tuukh of uilchluulegch.tuukh) {
            var orsonKhaalga = await zogsool.khaalga.find((a: any) =>
              a.camera.find((b: any) => b.cameraIP === tuukh.orsonKhaalga),
            );
            if (!orsonKhaalga && zogsool?.gadnaZogsooliinId) {
              if (zogsool.dotorZogsoolShuudGarakh && !!zogsool?.gadnaZogsooliinId) {
                var gadnaZogsool = await (Parking as any)(body.tukhainBaaziinKholbolt).findById(
                  zogsool?.gadnaZogsooliinId,
                );
                orsonKhaalga = await gadnaZogsool?.khaalga.find((a: any) =>
                  a.camera.find((b: any) => b.cameraIP === tuukh.orsonKhaalga),
                );
              } else {
                zogsool = await zogsooluud.find((x: any) => x._id != zogsool._id);
                if (zogsool) {
                  orsonKhaalga = await zogsool?.khaalga.find((a: any) =>
                    a.camera.find((b: any) => b.cameraIP === tuukh.orsonKhaalga),
                  );
                }
              }
            }
            if (orsonKhaalga) {
              const diff = Math.abs(body.check_out_time - tuukh.tsagiinTuukh[0].orsonTsag);
              let niitMinut = Math.floor(diff / (1000 * 60));
              if (!zogsool?.gadnaZogsooliinId) {
                uilchluulegch.niitKhugatsaa = niitMinut;
                if (dotorZogsoolMinut > 0 && niitMinut >= dotorZogsoolMinut) niitMinut = niitMinut - dotorZogsoolMinut;
              }
              if (zogsool?.tulburuud?.length > 0) {
                dun = await tulburBodoy(
                  zogsool.tulburuud,
                  body.check_out_time,
                  tuukh.tsagiinTuukh[0].orsonTsag,
                  zogsool.undsenUne,
                  zogsool.undsenMin,
                  dotorZogsoolMinut,
                  undefined,
                );
                if (dun == 0 && !uilchluulegch.zurchil && uilchluulegch.niitDun == 0) {
                  uilchluulegch.zurchil = 'Үнэгүй хугацаанд';
                } else if (dun > 0 && uilchluulegch.zurchil == 'Үнэгүй хугацаанд') {
                  uilchluulegch.zurchil = '';
                }
              } else {
                const time = zogsool.undsenMin ? 30 : 60;
                let tsag = Math.ceil(niitMinut / time);
                dun = tsag * zogsool.undsenUne;
              }
              tuukh.tsagiinTuukh[0].garsanTsag = odoo;
              tuukh.niitKhugatsaa = niitMinut;
              tuukh.tulukhDun = uilchluulegch.turul !== 'Үнэгүй' && uilchluulegch?.turul !== 'Дотоод' ? dun : 0;
              if (
                uilchluulegch.turul === 'Гэрээт' &&
                uilchluulegch?.mashin?.ekhlekhOgnoo &&
                uilchluulegch?.mashin?.duusakhOgnoo
              ) {
                if (
                  moment(new Date()).diff(uilchluulegch?.mashin?.ekhlekhOgnoo, 'd') >= 0 &&
                  moment(uilchluulegch?.mashin?.duusakhOgnoo).diff(new Date(), 'd') >= 0
                ) {
                  if (
                    uilchluulegch.mashin.gereetTulburBodokhEsekh &&
                    uilchluulegch.mashin.tulburBodokhTsagEkhlekh &&
                    uilchluulegch.mashin.tulburBodokhTsagDuusakh
                  ) {
                    let zuruuMinut = gereetZuruuMinutBodyo(
                      tuukh.tsagiinTuukh[0].orsonTsag,
                      body.check_out_time,
                      uilchluulegch.mashin.tulburBodokhTsagEkhlekh,
                      uilchluulegch.mashin.tulburBodokhTsagDuusakh,
                    );
                    if (zuruuMinut > 0) {
                      if (zogsool?.tulburuud?.length > 0) {
                        tuukh.tulukhDun = await tulburBodoy(
                          zogsool.tulburuud,
                          odoo.getTime(),
                          tuukh.tsagiinTuukh[0].orsonTsag,
                          zogsool.undsenUne,
                          zogsool.undsenMin,
                          dotorZogsoolMinut,
                          zuruuMinut,
                          true,
                        );
                      } else {
                        const time = zogsool.undsenMin ? 30 : 60;
                        let tsag = Math.ceil(zuruuMinut / time);
                        tuukh.tulukhDun = tsag * zogsool.undsenUne;
                      }
                    } else tuukh.tulukhDun = 0;
                    if (
                      uilchluulegch.mashin.gereetTulburBodokhEsekh &&
                      uilchluulegch.mashin.tulburBodokhTsagEkhlekhNeg &&
                      uilchluulegch.mashin.tulburBodokhTsagDuusakhNeg
                    ) {
                      zuruuMinut = gereetZuruuMinutBodyo(
                        tuukh.tsagiinTuukh[0].orsonTsag,
                        body.check_out_time,
                        uilchluulegch.mashin.tulburBodokhTsagEkhlekhNeg,
                        uilchluulegch.mashin.tulburBodokhTsagDuusakhNeg,
                      );
                      if (zuruuMinut > 0) {
                        if (zogsool?.tulburuud?.length > 0) {
                          tuukh.tulukhDun += await tulburBodoy(
                            zogsool.tulburuud,
                            odoo.getTime(),
                            tuukh.tsagiinTuukh[0].orsonTsag,
                            zogsool.undsenUne,
                            zogsool.undsenMin,
                            dotorZogsoolMinut,
                            zuruuMinut,
                            true,
                          );
                        } else {
                          const time = zogsool.undsenMin ? 30 : 60;
                          let tsag = Math.ceil(zuruuMinut / time);
                          tuukh.tulukhDun += tsag * zogsool.undsenUne;
                        }
                      }
                    }
                  } else {
                    tuukh.tulukhDun = 0;
                  }
                }
              }
              if (uilchluulegch.turul === 'Түрээслэгч' && uilchluulegch.mashin.tuluv !== 'Харилцагч') {
                if (uilchluulegch.mashin.tuluv === 'Үнэгүй') {
                  tuukh.tulukhDun = 0;
                }
                if (uilchluulegch.mashin.tuluv === 'Хөнгөлөлттэй') {
                  if (uilchluulegch.mashin.khungulultTurul === 'khuviKhungulult' && uilchluulegch.mashin.khungulult) {
                    tuukh.tulukhDun = Math.ceil(dun - (dun / 100) * uilchluulegch.mashin.khungulult);
                  }
                  if (
                    uilchluulegch.mashin.khungulultTurul === 'togtmolTsag' &&
                    ((body.baiguullagiinId === '63c0f31efe522048bf02086d' &&
                      !!uilchluulegch.mashin.zogsooliinTurul &&
                      (uilchluulegch.mashin.zogsooliinTurul === 'Бүгд' ||
                        (uilchluulegch.mashin.zogsooliinTurul === 'Гадна' && !!zogsool.dotorZogsooliinId) ||
                        (uilchluulegch.mashin.zogsooliinTurul === 'Дотор' && !!zogsool.gadnaZogsooliinId))) ||
                      body?.baiguullagiinId !== '63c0f31efe522048bf02086d')
                  ) {
                    if (
                      uilchluulegch.mashin.tsagiinTurul === 'Өдрөөр' ||
                      uilchluulegch.mashin.tsagiinTurul === 'Сараар'
                    ) {
                      const mashin: any = await (Mashin as any)(body.tukhainBaaziinKholbolt).findOne(mathchMashin);
                      const khugatsaaniiZuruu =
                        (zogsool.tulburuud[0].tariff[0].tulbur == 0 ? zogsool.tulburuud[0].tariff[0].minut : 0) -
                        niitMinut;
                      if (khugatsaaniiZuruu >= 0) {
                        tuukh.tulukhDun = 0;
                      } else {
                        if (uilchluulegch.mashin.uldegdelKhungulukhKhugatsaa - Math.abs(khugatsaaniiZuruu) >= 0) {
                          tuukh.tulukhDun = 0;
                          mashin.uldegdelKhungulukhKhugatsaa =
                            uilchluulegch.mashin.uldegdelKhungulukhKhugatsaa - Math.abs(khugatsaaniiZuruu);
                        }
                        if (uilchluulegch.mashin.uldegdelKhungulukhKhugatsaa - Math.abs(khugatsaaniiZuruu) < 0) {
                          const zuruuMinut = Math.abs(
                            Math.floor(uilchluulegch.mashin.uldegdelKhungulukhKhugatsaa - Math.abs(niitMinut)),
                          );
                          if (zogsool?.tulburuud?.length > 0) {
                            dun = await tulburBodoy(
                              zogsool.tulburuud,
                              body.check_out_time,
                              tuukh.tsagiinTuukh[0].orsonTsag,
                              zogsool.undsenUne,
                              zogsool.undsenMin,
                              dotorZogsoolMinut,
                              zuruuMinut,
                            );
                          } else {
                            const time = zogsool.undsenMin ? 30 : 60;
                            let tsag = Math.ceil(zuruuMinut / time);
                            dun = tsag * zogsool.undsenUne;
                          }
                          tuukh.tulukhDun = dun;
                          mashin.uldegdelKhungulukhKhugatsaa = 0;
                        }
                        mashin.save();
                      }
                    }
                  }
                }
              } else if (uilchluulegch.turul === 'Түрээслэгч' && uilchluulegch.mashin.tuluv === 'Харилцагч') {
                if (uilchluulegch.mashin.nemeltTuluv === 'Үнэгүй') {
                  tuukh.tulukhDun = 0;
                }
                if (uilchluulegch.mashin.nemeltTuluv === 'Хөнгөлөлттэй') {
                  if (uilchluulegch.mashin.khungulultTurul === 'khuviKhungulult' && uilchluulegch.mashin.khungulult) {
                    tuukh.tulukhDun = Math.ceil(dun - (dun / 100) * uilchluulegch.mashin.khungulult);
                  }
                  if (uilchluulegch.mashin.khungulultTurul === 'togtmolTsag') {
                    if (
                      uilchluulegch.mashin.tsagiinTurul === 'Өдрөөр' ||
                      uilchluulegch.mashin.tsagiinTurul === 'Сараар'
                    ) {
                      const mashin: any = await (Mashin as any)(body.tukhainBaaziinKholbolt).findOne(mathchMashin);
                      const khugatsaaniiZuruu =
                        (zogsool.tulburuud[0].tariff[0].tulbur == 0 ? zogsool.tulburuud[0].tariff[0].minut : 0) -
                        niitMinut;
                      if (khugatsaaniiZuruu >= 0) {
                        tuukh.tulukhDun = 0;
                      } else {
                        if (uilchluulegch.mashin.uldegdelKhungulukhKhugatsaa - Math.abs(khugatsaaniiZuruu) >= 0) {
                          tuukh.tulukhDun = 0;
                          mashin.uldegdelKhungulukhKhugatsaa =
                            uilchluulegch.mashin.uldegdelKhungulukhKhugatsaa - Math.abs(khugatsaaniiZuruu);
                        }
                        if (uilchluulegch.mashin.uldegdelKhungulukhKhugatsaa - Math.abs(khugatsaaniiZuruu) < 0) {
                          const zuruuMinut = Math.abs(
                            Math.floor(uilchluulegch.mashin.uldegdelKhungulukhKhugatsaa - Math.abs(khugatsaaniiZuruu)),
                          );
                          if (zogsool?.tulburuud?.length > 0) {
                            dun = await tulburBodoy(
                              zogsool.tulburuud,
                              body.check_out_time,
                              tuukh.tsagiinTuukh[0].orsonTsag,
                              zogsool.undsenUne,
                              zogsool.undsenMin,
                              dotorZogsoolMinut,
                              zuruuMinut,
                            );
                          } else {
                            const time = zogsool.undsenMin ? 30 : 60;
                            let tsag = Math.ceil(zuruuMinut / time);
                            dun = tsag * zogsool.undsenUne;
                          }
                          tuukh.tulukhDun = dun;
                          mashin.uldegdelKhungulukhKhugatsaa = 0;
                        }
                        mashin.save();
                      }
                    }
                  }
                }
              } else if (uilchluulegch?.turul === 'СӨХ') {
                if (!!mashin?.cameraIP) {
                  const filterTuukh: any = await (Uilchluulegch as any)(body.tukhainBaaziinKholbolt).find({
                    mashiniiDugaar: body.mashiniiDugaar,
                    'tuukh.zogsooliinId': zogsool._id.toString(),
                    'tuukh.orsonKhaalga': mashin?.cameraIP,
                    'tuukh.0.tsagiinTuukh.0.garsanTsag': {
                      $exists: false,
                    },
                    'tuukh.0.tuluv': {
                      $ne: -2,
                    },
                  });
                  if (filterTuukh?.length > 0) tuukh.tulukhDun = 0;
                } else {
                  if (body.baiguullagiinId === '6715ef2ca5cefb3e54505428') {
                    // jiguur
                    const flrTuukh: any = await (Uilchluulegch as any)(body.tukhainBaaziinKholbolt).find({
                      mashiniiDugaar: body.mashiniiDugaar,
                      'tuukh.zogsooliinId': zogsool._id.toString(),
                      'tuukh.orsonKhaalga': { $in: ['192.168.1.93', '192.168.1.94'] },
                      'tuukh.0.tsagiinTuukh.0.garsanTsag': {
                        $exists: false,
                      },
                      'tuukh.0.tuluv': {
                        $ne: -2,
                      },
                    });
                    if (flrTuukh?.length > 0) tuukh.tulukhDun = 0;
                  } else tuukh.tulukhDun = 0;
                }
              } else if (
                uilchluulegch?.turul === 'Дурын' &&
                zogsool?.togtmolTulburEsekh &&
                zogsool?.togtmolTulburiinDun > 0 &&
                tuukh.tulukhDun > 0
              ) {
                tuukh.tulukhDun = zogsool?.togtmolTulburiinDun;
              } else if (uilchluulegch?.turul === 'Зочин' && uilchluulegch?.urisanMashin?._id) {
                const urisanMashin = await (EzenUrisanMashin as any)(body.tukhainBaaziinKholbolt).findById(
                  uilchluulegch?.urisanMashin?._id,
                );
                if (!!urisanMashin) {
                  var tusBurAshiglasanUneguiMinut = 0;
                  const khugatsaaniiZuruu =
                    (zogsool.tulburuud[0].tariff[0].tulbur == 0 ? zogsool.tulburuud[0].tariff[0].minut : 0) - niitMinut;
                  if (khugatsaaniiZuruu >= 0) {
                    tuukh.tulukhDun = 0;
                  } else {
                    if (urisanMashin?.tusBurUneguiMinut - Math.abs(khugatsaaniiZuruu) >= 0) {
                      tuukh.tulukhDun = 0;
                      urisanMashin.tusBurUneguiMinut = urisanMashin?.tusBurUneguiMinut - Math.abs(khugatsaaniiZuruu);
                      tusBurAshiglasanUneguiMinut = Math.abs(khugatsaaniiZuruu);
                    } else if (urisanMashin.tusBurUneguiMinut - Math.abs(khugatsaaniiZuruu) < 0) {
                      const zuruuMinut = Math.abs(
                        Math.floor(urisanMashin.tusBurUneguiMinut - Math.abs(khugatsaaniiZuruu)),
                      );
                      if (zogsool?.tulburuud?.length > 0) {
                        dun = await tulburBodoy(
                          zogsool.tulburuud,
                          body.check_out_time,
                          tuukh.tsagiinTuukh[0].orsonTsag,
                          zogsool.undsenUne,
                          zogsool.undsenMin,
                          dotorZogsoolMinut,
                          zuruuMinut,
                        );
                      } else {
                        const time = zogsool.undsenMin ? 30 : 60;
                        let tsag = Math.ceil(zuruuMinut / time);
                        dun = tsag * zogsool.undsenUne;
                      }
                      tuukh.tulukhDun = dun;
                      tusBurAshiglasanUneguiMinut = urisanMashin.tusBurUneguiMinut;
                      urisanMashin.tusBurUneguiMinut = 0;
                    }
                  }
                  urisanMashin.tuluv = 2;
                  urisanMashin.tusBurAshiglasanUneguiMinut = tusBurAshiglasanUneguiMinut;
                  urisanMashin.tusBurAshiglasanUneguiMinutNiit =
                    (urisanMashin.tusBurAshiglasanUneguiMinutNiit || 0) + tusBurAshiglasanUneguiMinut;
                  urisanMashin.save();
                  uilchluulegch.urisanMashin = urisanMashin;
                }
              } else if (uilchluulegch?.turul === 'Байгууллага' && !!uilchluulegch?.mashin?._id && uilchluulegch?.mashin?.mashinuud?.length > 0) {
                const bgMashin = await (Mashin as any)(body.tukhainBaaziinKholbolt).findById(
                  uilchluulegch?.mashin?._id,
                );
                if (!!bgMashin) {
                  const khugatsaaniiZuruu = (zogsool.tulburuud[0].tariff[0].tulbur == 0 ? zogsool.tulburuud[0].tariff[0].minut : 0) - niitMinut;
                  if (khugatsaaniiZuruu >= 0) {
                    tuukh.tulukhDun = 0;
                  } else {
                    if (bgMashin.uldegdelKhungulukhKhugatsaa - Math.abs(khugatsaaniiZuruu) >= 0) {
                      tuukh.tulukhDun = 0;
                      bgMashin.uldegdelKhungulukhKhugatsaa -= Math.abs(khugatsaaniiZuruu);
                    } else if (bgMashin.uldegdelKhungulukhKhugatsaa - Math.abs(khugatsaaniiZuruu) < 0) {
                      const zuruuMinut = Math.abs(
                        Math.floor(bgMashin.uldegdelKhungulukhKhugatsaa - Math.abs(khugatsaaniiZuruu)),
                      );
                      if (zogsool?.tulburuud?.length > 0) {
                        dun = await tulburBodoy(
                          zogsool.tulburuud,
                          body.check_out_time,
                          tuukh.tsagiinTuukh[0].orsonTsag,
                          zogsool.undsenUne,
                          zogsool.undsenMin,
                          dotorZogsoolMinut,
                          zuruuMinut,
                        );
                      } else {
                        const time = zogsool.undsenMin ? 30 : 60;
                        let tsag = Math.ceil(zuruuMinut / time);
                        dun = tsag * zogsool.undsenUne;
                      }
                      tuukh.tulukhDun = dun;
                      bgMashin.uldegdelKhungulukhKhugatsaa = 0;
                    }
                  }
                  bgMashin.save();
                  uilchluulegch.mashin = bgMashin;
                }
              }

              uilchluulegch.niitDun = uilchluulegch.niitDun + tuukh.tulukhDun;
              if (
                uilchluulegch.mashin &&
                uilchluulegch.mashin.tsenegleltUldegdel &&
                uilchluulegch.mashin.tsenegleltUldegdel > 0 &&
                tuukh.tulukhDun > 0
              ) {
                const mashin: any = await (Mashin as any)(body.tukhainBaaziinKholbolt).findOne(mathchMashin);
                const tulburiinZuruu = uilchluulegch.mashin.tsenegleltUldegdel - tuukh.tulukhDun;
                if (tulburiinZuruu > 0) {
                  let tulbur = [
                    {
                      ognoo: new Date(),
                      turul: 'tseneglelt',
                      dun: tuukh.tulukhDun,
                    },
                  ];
                  tuukh.burtgesenAjiltaniiNer = 'tseneglelt';
                  tuukh.tulbur = tulbur;
                  tuukh.tuluv = 1;
                  mashin.tsenegleltUldegdel = tulburiinZuruu;
                  if (mashin.tsenegleltTuukh && mashin.tsenegleltTuukh.length > 0) {
                    mashin.tsenegleltTuukh.push({
                      ognoo: new Date(),
                      turul: 'zarlaga',
                      dun: tuukh.tulukhDun,
                      uldegdel: uilchluulegch.mashin.tsenegleltUldegdel,
                    });
                  } else {
                    mashin.tsenegleltTuukh = [
                      {
                        ognoo: new Date(),
                        turul: 'zarlaga',
                        dun: tuukh.tulukhDun,
                        uldegdel: uilchluulegch.mashin.tsenegleltUldegdel,
                      },
                    ];
                  }
                  uilchluulegch.niitDun = 0; //unegui gargay
                  mashin.save();
                } else {
                  let tulbur = [
                    {
                      ognoo: new Date(),
                      turul: 'tseneglelt',
                      dun: uilchluulegch.mashin.tsenegleltUldegdel,
                    },
                  ];
                  tuukh.tulbur = tulbur;
                  tuukh.burtgesenAjiltaniiId = 'tseneglelt';
                  tuukh.burtgesenAjiltaniiNer = 'tseneglelt';
                  tuukh.tuluv = 0;
                  mashin.tsenegleltUldegdel = 0;
                  if (mashin.tsenegleltTuukh && mashin.tsenegleltTuukh.length > 0) {
                    mashin.tsenegleltTuukh.push({
                      ognoo: new Date(),
                      turul: 'zarlaga',
                      dun: tuukh.tulukhDun,
                      uldegdel: 0,
                    });
                  } else {
                    mashin.tsenegleltTuukh = [
                      {
                        ognoo: new Date(),
                        turul: 'zarlaga',
                        dun: tuukh.tulukhDun,
                        uldegdel: 0,
                      },
                    ];
                  }
                  mashin.save();
                }
              }
              if (
                (uilchluulegch.garakhTsag && uilchluulegch.garakhTsag > new Date()) ||
                (!!tokiUilchluulegch && !!tokiUilchluulegch.garakhTsag && tokiUilchluulegch.garakhTsag > new Date())
              ) {
                const dun = tuukh.tulbur?.reduce((a: any, b: any) => a + (b.dun || 0), 0);
                if(dun === uilchluulegch.niitDun)
                {
                  //tulburuu uridchilj tulsun ued
                  uilchluulegch.niitDun = 0;
                  tuukh.tulukhDun = 0;
                  tuukh.tuluv = 2;
                }
              }
              if (!!zogsool.uneguiOrokhCameraIP && tuukh.orsonKhaalga === zogsool.uneguiOrokhCameraIP) {
                // golden bilegt dotor orkhoor orson bol unegui gargana
                tuukh.tulbur = [];
                uilchluulegch.niitDun = 0;
                tuukh.tulukhDun = 0;
                tuukh.tuluv = -1;
              }
              if (tuukh.tulbur.some((tulbur: any) => tulbur?.turul === 'khungulult')) {
                const tukhainKhungulsunDun = tuukh.tulbur.find((tulbur: any) => tulbur?.turul === 'khungulult').dun;
                if (tukhainKhungulsunDun >= tuukh.tulukhDun) {
                  const shinechilsenTulbur = tuukh.tulbur.map((tulbur: any) => {
                    if (tulbur?.turul === 'khungulult') {
                      return {
                        ...tulbur,
                        dun: tuukh.tulukhDun,
                      };
                    }
                    return tulbur;
                  });
                  tuukh.tulbur = shinechilsenTulbur;
                  uilchluulegch.niitDun = 0;
                  tuukh.tulukhDun = 0;
                  tuukh.tuluv = 2;
                }
              }
              if (tuukh.tulbur.some((tulbur: any) => tulbur?.turul === 'Хөнгөлөлт/ 2 цаг')) {
                const tukhainKhungulsunDun = tuukh.tulbur.find(
                  (tulbur: any) => tulbur?.turul === 'Хөнгөлөлт/ 2 цаг',
                ).dun;
                if (tukhainKhungulsunDun >= tuukh.tulukhDun) {
                  const shinechilsenTulbur = tuukh.tulbur.map((tulbur: any) => {
                    if (tulbur?.turul === 'Хөнгөлөлт/ 2 цаг') {
                      return {
                        ...tulbur,
                        dun: tuukh.tulukhDun,
                      };
                    }
                    return tulbur;
                  });
                  tuukh.tulbur = shinechilsenTulbur;
                  uilchluulegch.niitDun = 0;
                  tuukh.tulukhDun = 0;
                  tuukh.tuluv = 2;
                }
              }
              if (tuukh.tulbur.some((tulbur: any) => tulbur?.turul === 'Хөнгөлөлт/ 24 цаг')) {
                const tukhainKhungulsunDun = tuukh.tulbur.find(
                  (tulbur: any) => tulbur?.turul === 'Хөнгөлөлт/ 24 цаг',
                ).dun;
                if (tukhainKhungulsunDun >= tuukh.tulukhDun) {
                  const shinechilsenTulbur = tuukh.tulbur.map((tulbur: any) => {
                    if (tulbur?.turul === 'Хөнгөлөлт/ 24 цаг') {
                      return {
                        ...tulbur,
                        dun: tuukh.tulukhDun,
                      };
                    }
                    return tulbur;
                  });
                  tuukh.tulbur = shinechilsenTulbur;
                  uilchluulegch.niitDun = 0;
                  tuukh.tulukhDun = 0;
                  tuukh.tuluv = 2;
                }
              }
              if (tuukh.tulbur.some((tulbur: any) => tulbur?.turul?.includes('Божон'))) {
                const tukhainKhungulsunDun = tuukh.tulbur.find((tulbur: any) => tulbur?.turul?.includes('Божон')).dun;
                if (tukhainKhungulsunDun >= tuukh.tulukhDun) {
                  const shinechilsenTulbur = tuukh.tulbur.map((tulbur: any) => {
                    if (tulbur?.turul?.includes('Божон')) {
                      return {
                        ...tulbur,
                        dun: tuukh.tulukhDun,
                      };
                    }
                    return tulbur;
                  });
                  tuukh.tulbur = shinechilsenTulbur;
                  uilchluulegch.niitDun = 0;
                  tuukh.tulukhDun = 0;
                  tuukh.tuluv = 2;
                }
              }
              if (tuukh.tulbur.some((tulbur: any) => tulbur?.turul === 'Соёолж Ц/Д')) {
                const tukhainDun = tuukh.tulbur.find((tulbur: any) => tulbur?.turul === 'Соёолж Ц/Д').dun;
                if (tukhainDun >= tuukh.tulukhDun) {
                  // 4000 >= 4000
                  const shinechilsenTulbur = tuukh.tulbur.map((tulbur: any) => {
                    if (tulbur?.turul === 'Соёолж Ц/Д') {
                      return {
                        ...tulbur,
                        dun: tuukh.tulukhDun,
                      };
                    }
                    return tulbur;
                  });
                  tuukh.tulbur = shinechilsenTulbur;
                  uilchluulegch.niitDun = 0;
                  tuukh.tulukhDun = 0;
                  tuukh.tuluv = 2;
                }
              }
              if (tuukh.tulbur.some((tulbur: any) => tulbur?.turul === 'toki')) {
                const tukhainDun = tuukh.tulbur.find((tulbur: any) => tulbur?.turul === 'toki').dun;
                if (tukhainDun >= tuukh.tulukhDun) {
                  // 4000 >= 4000
                  uilchluulegch.niitDun = 0;
                  tuukh.tulukhDun = 0;
                  tuukh.tuluv = 2;
                }
              }
              if (tuukh.uneguiGarsan === 'Үнэгүй зочид') {
                uilchluulegch.niitDun = 0;
                tuukh.tulukhDun = 0;
                tuukh.tuluv = -1;
              }
              if (tuukh.tulbur.some((tulbur: any) => tulbur?.turul === 'Хөнгөлөлт')) {
                const tukhainDun = tuukh.tulbur.find((tulbur: any) => tulbur?.turul === 'Хөнгөлөлт').dun;
                if (tukhainDun >= tuukh.tulukhDun) {
                  // 4000 >= 4000
                  const shinechilsenTulbur = tuukh.tulbur.map((tulbur: any) => {
                    if (tulbur?.turul === 'Хөнгөлөлт') {
                      return {
                        ...tulbur,
                        dun: tuukh.tulukhDun,
                      };
                    }
                    return tulbur;
                  });
                  tuukh.tulbur = shinechilsenTulbur;
                  uilchluulegch.niitDun = 0;
                  tuukh.tulukhDun = 0;
                  tuukh.tuluv = 2;
                }
              }
              tuukh.tsagiinTuukh[0].garsanTsag = odoo;
              // uilchluulegch.tuukh[0].tulukhDun = uilchluulegch.mashin.turul !== "Үнэгүй" ? dun : 0;
              tuukh.garsanKhaalga = body.CAMERA_IP;
            }
            dotorZogsoolMinut = dotorZogsoolMinut + (tuukh?.niitKhugatsaa || 0);
          }
          if (uilchluulegch?.tuukh?.length > 1) {
            uilchluulegch.tuukh.reverse();
          }
          uilchluulegch.save();
          if (!!nemeltZogsool) {
            (Uilchluulegch as any)(body.tukhainBaaziinKholbolt).deleteOne({
              mashiniiDugaar: body.mashiniiDugaar,
              'tuukh.0.tsagiinTuukh.0.garsanTsag': {
                $exists: false,
              },
              'tuukh.0.tuluv': {
                $ne: -2,
              },
              'tuukh.0.zogsooliinId': {
                $ne: zogsool._id.toString(),
              },
            });
          }
          if (!zogsool?.gadnaZogsooliinId && !zogsool?.garakhKhaalgaGarTokhirgoo) {
            if (io) io.emit(`zogsool${uilchluulegch.baiguullagiinId}`, uilchluulegch);
            const mashin: any = await (Mashin as any)(body.tukhainBaaziinKholbolt).findOne(mathchMashin);
            if (!!mashin?.dugaar) {
              callback(uilchluulegch, mashin?.ezemshigchiinId);
            }
          } else if (!!zogsool?.gadnaZogsooliinId && io && body.CAMERA_IP && !zogsool?.garakhKhaalgaGarTokhirgoo)
            io.emit(
              `zogsool${uilchluulegch.baiguullagiinId}`,
              zogsool.dotorZogsoolShuudGarakh ? uilchluulegch : { khaalgaTurul: 'garakh', cameraIP: body.CAMERA_IP },
            );
          if (
            !!zogsool?.tokiNer ||
            (!!nemeltZogsool && !!nemeltZogsool.tokiNer && !!tokiUilchluulegch && !zogsool.gadnaZogsooliinId)
          ) {
            var id;
            if (!!nemeltZogsool && !!nemeltZogsool.tokiNer) {
              var tulukhDun = await zogsooliinDunAvya(nemeltZogsool, tokiUilchluulegch, body.erunkhiiKholbolt);
              tokiUilchluulegch.niitDun = tulukhDun;
              id = await tokiIlgeeye(nemeltZogsool, tokiUilchluulegch, 'garakh', body.erunkhiiKholbolt);
            } else {
              id = await tokiIlgeeye(zogsool, uilchluulegch, 'garakh', body.erunkhiiKholbolt);
            }
            if (!!id) {
              let tulbur = [
                {
                  ognoo: new Date(),
                  turul: 'toki',
                  dun: uilchluulegch.niitDun,
                },
              ];
              await Uilchluulegch(body.tukhainBaaziinKholbolt).updateOne(
                { _id: req.body.id },
                {
                  $set: {
                    'tuukh.$[t].burtgesenAjiltaniiNer': 'toki',
                    'tuukh.$[t].tulbur': tulbur,
                    'tuukh.$[t].tuluv': 1,
                    tokiId: id,
                  },
                },
                {
                  arrayFilters: [
                    {
                      't.zogsooliinId': zogsool._id,
                    },
                  ],
                },
              );
            }
          }
        } else {
          if (zogsool?.davkharGarakhUnshilt) {
            const uniguiMashinuud: any = await (Uilchluulegch as any)(body.tukhainBaaziinKholbolt)
              .find({
                baiguullagiinId: zogsool?.baiguullagiinId,
                mashiniiDugaar: body.mashiniiDugaar,
                'tuukh.zogsooliinId': zogsool?._id.toString(),
                'tuukh.0.tsagiinTuukh.0.garsanTsag': { $exists: true },
                'tuukh.0.tuluv': 0,
                'tuukh.0.garsanKhaalga': body.CAMERA_IP,
              })
              .sort({ createdAt: -1 })
              .limit(1);
            if (uniguiMashinuud?.length > 0) {
              await Uilchluulegch(body.tukhainBaaziinKholbolt).updateOne(
                { _id: uniguiMashinuud[0]?._id.toString() },
                {
                  $unset: {
                    'tuukh.0.tsagiinTuukh.0.garsanTsag': 1,
                    'tuukh.0.garsanKhaalga': 1,
                    zurchil: 1,
                  },
                },
              );
              await Uilchluulegch(body.tukhainBaaziinKholbolt).updateOne(
                { _id: uniguiMashinuud[0]?._id.toString() },
                {
                  $set: {
                    niitDun: 0,
                    niitKhugatsaa: 0,
                    'tuukh.0.tulukhDun': 0,
                    'tuukh.0.niitKhugatsaa': 0,
                    'tuukh.0.tulbur': [],
                  },
                },
              );
              await sdkData(req, callback);
            }
          }
          return {
            aldaa: 'Машин бүртгэгдээгүй байна.',
          };
        }
        if (
          zogsool?.zogsoolKhuleekhMashinEsekh &&
          !zogsool?.gadnaZogsooliinId &&
          zogsool?.zogsoolTooKhyazgaarlakhEsekh &&
          (sulToo == 0 || sulToo <= -1)
        ) {
          const filterTsagiinTuukh: any = await (Uilchluulegch as any)(body.tukhainBaaziinKholbolt)
            .find({
              baiguullagiinId: zogsool.baiguullagiinId,
              barilgiinId: zogsool.barilgiinId,
              createdAt: {
                $gte: new Date(moment().startOf('day').format('YYYY-MM-DD 00:00:00')),
                $lte: new Date(moment().endOf('day').format('YYYY-MM-DD 23:59:59')),
              },
              'tuukh.tsagiinTuukh': { $size: 0 },
            })
            .sort({ createdAt: -1 })
            .limit(1);
          if (filterTsagiinTuukh?.length > 0) {
            await Uilchluulegch(body.tukhainBaaziinKholbolt).updateOne(
              { _id: filterTsagiinTuukh[0]?._id.toString() },
              {
                $set: {
                  'tuukh.0.tsagiinTuukh.0.orsonTsag': odoo,
                },
              },
            );
            if (io && body.CAMERA_IP && !zogsool.orokhKhaalgaGarTokhirgoo && !req.body.neesenEsekh)
              io.emit(`zogsool${body.baiguullagiinId}`, {
                khaalgaTurul: 'oroh',
                cameraIP: filterTsagiinTuukh[0]?.tuukh[0].orsonKhaalga,
                mashiniiDugaar: filterTsagiinTuukh[0]?.mashiniiDugaar,
              });
          }
        }
      } else {
        const blockMashin: any = await (BlockMashin as any)(body.tukhainBaaziinKholbolt).findOne({
          dugaar: body.mashiniiDugaar,
          barilgiinId: zogsool.barilgiinId,
        });
        if (!!blockMashin) {
          if (io) {
            io.emit(`zogsool${zogsool?.baiguullagiinId}`, {
              khaalgaTurul: 'oroh',
              cameraIP: body.CAMERA_IP,
              mashiniiDugaar: 'Blocked ' + body.mashiniiDugaar,
              oruulakhguiEsekh: true,
            });
          }
          return {
            aldaa: body.mashiniiDugaar + ' дугаартай машиныг орохыг хориглосон байна.',
          };
        }
        else
        {
          const mashin: any = await (Mashin as any)(body.tukhainBaaziinKholbolt).findOne(mathchMashin);
          const olonMashin: any = await (Mashin as any)(body.tukhainBaaziinKholbolt).findOne(matchOlonMashin);
          if (khaalga?.turul === 'Орох' && zogsool?.zogsoolTooKhyazgaarlakhEsekh && (sulToo === 0 || sulToo <= -1) && mashin?.turul !== 'VIP') {
            if (zogsool?.zogsoolKhuleekhMashinEsekh && !zogsool?.gadnaZogsooliinId) {
              await (Uilchluulegch as any)(body.tukhainBaaziinKholbolt).deleteMany({
                mashiniiDugaar: body.mashiniiDugaar,
                barilgiinId: zogsool.barilgiinId,
                'tuukh.0.tsagiinTuukh.0.garsanTsag': {
                  $exists: false,
                },
                'tuukh.0.tuluv': {
                  $ne: -2,
                },
              });
              await (Uilchluulegch as any)(body.tukhainBaaziinKholbolt).deleteMany({
                baiguullagiinId: zogsool.baiguullagiinId,
                barilgiinId: zogsool.barilgiinId,
                createdAt: {
                  $gte: new Date(moment().startOf('day').format('YYYY-MM-DD 00:00:00')),
                  $lte: new Date(moment().endOf('day').format('YYYY-MM-DD 23:59:59')),
                },
                'tuukh.tsagiinTuukh': { $size: 0 },
              });
              const model = new (Uilchluulegch as any)(body.tukhainBaaziinKholbolt)();
              model.baiguullagiinId = body.baiguullagiinId;
              model.barilgiinId = zogsool.barilgiinId;
              model.mashiniiDugaar = body.mashiniiDugaar;
              model.tuukh = [
                {
                  zogsooliinId: zogsool._id,
                  undsenUne: zogsool.undsenUne,
                  orsonKhaalga: body.CAMERA_IP,
                },
              ];
              if (!!mashin) {
                model.turul = mashin.turul;
                model.mashin = mashin;
              }
              else if(!!olonMashin){
                model.turul = olonMashin.turul;
                model.mashin = olonMashin;
              }
              model.save();
            }
            const io = req.app.get('socketio');
            if (io) {
              io.emit(`zogsool${zogsool?.baiguullagiinId}`, {
                khaalgaTurul: 'oroh',
                cameraIP: body.CAMERA_IP,
                mashiniiDugaar: 'Дүүрсэн',
                oruulakhguiEsekh: true,
              });
            }
          } else {
            var orokhEskh = true;
            var camereFilter = khaalga?.camera?.find((b: any) => b.cameraIP === body.CAMERA_IP);
            if (khaalga?.turul === 'Орох' && camereFilter?.tokhirgoo?.dotorKamerEsekh) {
              orokhEskh = false;
              if (mashin?.turul === 'СӨХ') {
                if (!!mashin?.cameraIP && mashin?.cameraIP === body.CAMERA_IP) {
                  const mashinJagsaalt: any = await (Mashin as any)(body.tukhainBaaziinKholbolt).find({
                    ezemshigchiinUtas: mashin?.ezemshigchiinUtas,
                    cameraIP: body.CAMERA_IP,
                    barilgiinId: zogsool.barilgiinId,
                    turul: 'СӨХ',
                  });
                  const filterMashin: any = await (Mashin as any)(body.tukhainBaaziinKholbolt).find({
                    ezemshigchiinUtas: mashin?.ezemshigchiinUtas,
                    cameraIP: body.CAMERA_IP,
                    barilgiinId: zogsool.barilgiinId,
                    turul: 'СӨХ',
                    tuluv: 'Дотор',
                  });
                  var countDotor = filterMashin?.length > 0 ? filterMashin?.length : 0;
                  var mashinFilter = mashinJagsaalt?.map((m: any) => m.dugaar);
                  const uilchluulegchBusadMashin: any = await (Uilchluulegch as any)(body.tukhainBaaziinKholbolt).find({
                    mashiniiDugaar: { $in: mashinFilter },
                    'tuukh.zogsooliinId': zogsool._id.toString(),
                    'tuukh.orsonKhaalga': body.CAMERA_IP,
                    'tuukh.0.tsagiinTuukh.0.garsanTsag': {
                      $exists: false,
                    },
                    'tuukh.0.tuluv': {
                      $ne: -2,
                    },
                  });
                  if (
                    !uilchluulegchBusadMashin ||
                    uilchluulegchBusadMashin?.length === 0 ||
                    uilchluulegchBusadMashin?.length < countDotor
                  )
                    orokhEskh = true;
                }
                if (body.baiguullagiinId === '6715ef2ca5cefb3e54505428' && !mashin?.cameraIP) {
                  if (camereFilter?.tokhirgoo?.dotorDulaanKamerEsekh) {
                    const mashinJag: any = await (Mashin as any)(body.tukhainBaaziinKholbolt).find({
                      ezemshigchiinUtas: mashin?.ezemshigchiinUtas,
                      barilgiinId: zogsool.barilgiinId,
                      turul: 'СӨХ',
                    });
                    const filterM: any = await (Mashin as any)(body.tukhainBaaziinKholbolt).find({
                      ezemshigchiinUtas: mashin?.ezemshigchiinUtas,
                      barilgiinId: zogsool.barilgiinId,
                      turul: 'СӨХ',
                      tuluv: 'Дотор',
                    });
                    var ctDotor = filterM?.length > 0 ? filterM?.length : 0;
                    var mashinFltr = mashinJag?.map((m: any) => m.dugaar);
                    const uilchluulegchBMashin: any = await (Uilchluulegch as any)(body.tukhainBaaziinKholbolt).find({
                      mashiniiDugaar: { $in: mashinFltr },
                      'tuukh.zogsooliinId': zogsool._id.toString(),
                      'tuukh.orsonKhaalga': body.CAMERA_IP,
                      'tuukh.0.tsagiinTuukh.0.garsanTsag': {
                        $exists: false,
                      },
                      'tuukh.0.tuluv': {
                        $ne: -2,
                      },
                    });
                    if (uilchluulegchBMashin?.length === 0 || uilchluulegchBMashin?.length < ctDotor) orokhEskh = true;
                  } else orokhEskh = true;
                }
              } 
              else if (mashin?.turul === 'VIP')
                orokhEskh = true;
            }
            if (orokhEskh) {
              if (!!zogsool?.gadnaZogsooliinId) {
                const uilchluulegch: any = await (Uilchluulegch as any)(body.tukhainBaaziinKholbolt).findOne({
                  mashiniiDugaar: body.mashiniiDugaar,
                  'tuukh.0.tsagiinTuukh.0.garsanTsag': {
                    $exists: false,
                  },
                  'tuukh.0.tuluv': {
                    $ne: -2,
                  },
                  // tuukh: {
                  //   $size: { $gte: 1 },
                  // },
                }); //HAMGIIN SUULIINH NI BAIH
                if (!!uilchluulegch) {
                  const filterrsonKhaalga: any = await (Uilchluulegch as any)(body.tukhainBaaziinKholbolt).findOne({
                    mashiniiDugaar: body.mashiniiDugaar,
                    'tuukh.0.tsagiinTuukh.0.garsanTsag': {
                      $exists: false,
                    },
                    'tuukh.0.tuluv': {
                      $ne: -2,
                    },
                    'tuukh.zogsooliinId': zogsool?._id.toString(),
                    'tuukh.orsonKhaalga': body.CAMERA_IP,
                  });
                  if (!filterrsonKhaalga) {
                    uilchluulegch.tuukh.push({
                      tsagiinTuukh: [
                        {
                          orsonTsag: odoo,
                        },
                      ],
                      zogsooliinId: zogsool._id,
                      undsenUne: zogsool.undsenUne,
                      orsonKhaalga: body.CAMERA_IP,
                    });
                    uilchluulegch.save();
                    if (!!zogsool?.tokiNer) tokiIlgeeye(zogsool, uilchluulegch, 'orokh', body.erunkhiiKholbolt);
                  }
                }
              } else {
                const uilchluulegch: any = await (Uilchluulegch as any)(body.tukhainBaaziinKholbolt).findOne({
                  mashiniiDugaar: body.mashiniiDugaar,
                  'tuukh.0.tsagiinTuukh.0.garsanTsag': {
                    $exists: false,
                  },
                  'tuukh.0.tuluv': {
                    $ne: -2,
                  },
                });
                if (!!uilchluulegch) {
                  await (Uilchluulegch as any)(body.tukhainBaaziinKholbolt).updateMany(
                    {
                      mashiniiDugaar: body.mashiniiDugaar,
                      'tuukh.0.tsagiinTuukh.0.garsanTsag': {
                        $exists: false,
                      },
                      'tuukh.0.tsagiinTuukh.0.orsonTsag': {
                        $lt: new Date(Date.now() - 60000),
                      },
                      'tuukh.0.tuluv': {
                        $ne: -2,
                      },
                    },
                    {
                      $set: {
                        'tuukh.0.garsanKhaalga': 'zurchiltei',
                        'tuukh.0.tsagiinTuukh.0.garsanTsag': new Date().toISOString(),
                        'tuukh.0.tuluv': -2,
                        zurchil: 'Гарсан цаг тодорхойгүй!',
                      },
                    },
                  );
                  await (Uilchluulegch as any)(body.tukhainBaaziinKholbolt).deleteMany({
                    mashiniiDugaar: body.mashiniiDugaar,
                    'tuukh.0.tsagiinTuukh.0.garsanTsag': {
                      $exists: false,
                    },
                    // 'tuukh.0.tsagiinTuukh.0.orsonTsag': {
                    //   $gt: new Date(Date.now() - 60000),
                    // },
                    'tuukh.0.tuluv': {
                      $ne: -2,
                    },
                  });
                }
                const orokhMashin: any = await (Uilchluulegch as any)(body.tukhainBaaziinKholbolt).findOne({
                  baiguullagiinId: body.baiguullagiinId,
                  barilgiinId: zogsool.barilgiinId,
                  mashiniiDugaar: body.mashiniiDugaar,
                  'tuukh.0.tsagiinTuukh.0.garsanTsag': {
                    $exists: false,
                  },
                  'tuukh.0.tuluv': {
                    $ne: -2,
                  },
                  'tuukh.zogsooliinId': zogsool?._id.toString(),
                  'tuukh.orsonKhaalga': body.CAMERA_IP,
                });
                if (!orokhMashin) {
                  const model = new (Uilchluulegch as any)(body.tukhainBaaziinKholbolt)();
                  model.baiguullagiinId = body.baiguullagiinId;
                  model.barilgiinId = zogsool.barilgiinId;
                  model.mashiniiDugaar = body.mashiniiDugaar;
                  model.tuukh = [
                    {
                      tsagiinTuukh: [
                        {
                          orsonTsag: odoo,
                        },
                      ],
                      zogsooliinId: zogsool._id,
                      undsenUne: zogsool.undsenUne,
                      orsonKhaalga: body.CAMERA_IP,
                    },
                  ];
                  if (!!mashin) {
                    model.turul = mashin.turul;
                    model.mashin = mashin;
                  }
                  else if(!!olonMashin) {
                    model.turul = olonMashin.turul;
                    model.mashin = olonMashin;
                  }
                  const urisanMashin: any = await (EzenUrisanMashin as any)(body.tukhainBaaziinKholbolt).findOne({
                    baiguullagiinId: body.baiguullagiinId,
                    urisanMashiniiDugaar: body.mashiniiDugaar,
                    tuluv: { $in: [0, 1] },
                  });
                  if (!!urisanMashin) {
                    model.turul = 'Зочин';
                    model.urisanMashin = urisanMashin;
                    urisanMashin.tuluv = 1;
                    urisanMashin.save();
                  }
                  model.save();
                  if (!!zogsool?.tokiNer) tokiIlgeeye(zogsool, model, 'orokh', body.erunkhiiKholbolt);
                }
                if (zogsool?.zurchulMsgeerSanuulakh && zogsool?.zurchilTootsojEkhlekhOgnoo && !mashin) {
                  const zurchilteiUilchluulegch: any = await (Uilchluulegch as any)(body.tukhainBaaziinKholbolt).find({
                    baiguullagiinId: zogsool?.baiguullagiinId,
                    barilgiinId: zogsool.barilgiinId,
                    'tuukh.zogsooliinId': zogsool?._id.toString(),
                    'tuukh.tulbur': [],
                    'tuukh.tsagiinTuukh.garsanTsag': { $exists: true },
                    'tuukh.garsanKhaalga': { $exists: true },
                    niitDun: { $gt: zogsool?.tulburiinLimitDun || 0 },
                    mashiniiDugaar: body.mashiniiDugaar,
                    turul: { $exists: false },
                    createdAt: {
                      $gte: new Date(moment(zogsool?.zurchilTootsojEkhlekhOgnoo).format('YYYY-MM-DD 00:00:00')),
                    },
                  });
                  if (zurchilteiUilchluulegch?.length > 0) {
                    for await (const zurchil of zurchilteiUilchluulegch) {
                      const zurchilteiData: any = await (ZurchilteiMashin as any)(body.tukhainBaaziinKholbolt).findOne({
                        baiguullagiinId: zurchil?.baiguullagiinId,
                        barilgiinId: zurchil?.barilgiinId,
                        uilchluulegchiinId: zurchil?._id.toString(),
                        zogsooliinId: zurchil?.tuukh[0]?.zogsooliinId,
                        mashiniiDugaar: zurchil?.mashiniiDugaar,
                      });
                      if (!zurchilteiData) {
                        const zurchilModel = new (ZurchilteiMashin as any)(body.tukhainBaaziinKholbolt)();
                        zurchilModel.baiguullagiinId = zurchil?.baiguullagiinId;
                        zurchilModel.barilgiinId = zurchil?.barilgiinId;
                        zurchilModel.uilchluulegchiinId = zurchil?._id.toString();
                        zurchilModel.mashiniiDugaar = zurchil?.mashiniiDugaar;
                        zurchilModel.zogsooliinId = zurchil?.tuukh[0]?.zogsooliinId;
                        zurchilModel.niitKhugatsaa = zurchil?.niitKhugatsaa;
                        zurchilModel.orsonKhaalga = zurchil?.tuukh[0].orsonKhaalga;
                        zurchilModel.garsanKhaalga = zurchil?.tuukh[0].garsanKhaalga;
                        zurchilModel.orsonTsag = zurchil?.tuukh[0].tsagiinTuukh[0].orsonTsag;
                        zurchilModel.garsanTsag = zurchil?.tuukh[0].tsagiinTuukh[0].garsanTsag;
                        zurchilModel.niitDun = zurchil?.niitDun;
                        zurchilModel.turul = zurchil?.turul;
                        zurchilModel.tuluv = 0;
                        zurchilModel.save();
                      }
                    }
                  }
                }
                if (!!nemeltZogsool) {
                  var nelemt = new (Uilchluulegch as any)(body.tukhainBaaziinKholbolt)();
                  nelemt.baiguullagiinId = body.baiguullagiinId;
                  nelemt.barilgiinId = zogsool.barilgiinId;
                  nelemt.mashiniiDugaar = body.mashiniiDugaar;
                  nelemt.tuukh = [
                    {
                      tsagiinTuukh: [
                        {
                          orsonTsag: odoo,
                        },
                      ],
                      zogsooliinId: nemeltZogsool._id,
                      undsenUne: nemeltZogsool.undsenUne,
                      orsonKhaalga: body.CAMERA_IP,
                    },
                  ];
                  if (!!mashin) {
                    nelemt.turul = mashin.turul;
                    nelemt.mashin = mashin;
                  }
                  nelemt.save();
                }
              }
              if (io && body.CAMERA_IP && !zogsool.orokhKhaalgaGarTokhirgoo && !req.body.neesenEsekh)
                io.emit(`zogsool${body.baiguullagiinId}`, {
                  khaalgaTurul: 'oroh',
                  cameraIP: body.CAMERA_IP,
                  mashiniiDugaar: body.mashiniiDugaar,
                });
            } else {
              const io = req.app.get('socketio');
              if (io) {
                io.emit(`zogsool${zogsool?.baiguullagiinId}`, {
                  khaalgaTurul: 'oroh',
                  cameraIP: body.CAMERA_IP,
                  mashiniiDugaar: 'Зөвшөөрөлгүй',
                  oruulakhguiEsekh: true,
                });
              }
            }
          }
        }
      }
    }
  } catch (error: any) {
    throw new Error(error);
  }
}

export async function uilchluulegchGaraasBurtgey(req: any) {
  try {
    const body = req.body;
    const odoo = new Date();
    const query: any = {
      'khaalga.camera.cameraIP': body.orsonCamera,
    };
    if (!!body.barilgiinId) query['barilgiinId'] = body.barilgiinId;
    const zogsool = await (Parking as any)(body.tukhainBaaziinKholbolt).findOne(query);
    const model = new (Uilchluulegch as any)(body.tukhainBaaziinKholbolt)();
    model.baiguullagiinId = body.baiguullagiinId;
    model.barilgiinId = body.barilgiinId;
    model.mashiniiDugaar = body.mashiniiDugaar;
    model.tuukh = [
      {
        tsagiinTuukh: [
          {
            orsonTsag: odoo,
            garsanTsag: odoo,
          },
        ],
        zogsooliinId: zogsool._id,
        undsenUne: zogsool.undsenUne,
        orsonKhaalga: body.orsonCamera,
        garsanKhaalga: body.garsanCamera,
        tulukhDun: body.tulukhDun,
        tuluv: 0,
        tulbur: [],
      },
    ];
    model.niitDun = body.tulukhDun;
    let khadgalsanModel = await model.save();
    let butsaakhModel = await (Uilchluulegch as any)(body.tukhainBaaziinKholbolt).findById(khadgalsanModel._id);
    return butsaakhModel;
  } catch (err: any) {
    throw new Error(err);
  }
}

export async function zogsooliinDunAvya(zogsool: any, uilchluulegch: any, tukhainBaaziinKholbolt: any) {
  try {
    var odoo = new Date();
    const freeze = new Date(uilchluulegch.freezeOgnoo);
    const freezePlus = new Date(freeze.getTime() + (zogsool?.garakhTsag || 30) * 60000);
    if (!isNaN(freeze.getTime()) && freezePlus > new Date()) {
      odoo = freeze;
    }
    let dun = 0;
    let dotorZogsoolMinut = 0;
    let dotorZogsoolDun = 0;
    const diff = Math.abs(odoo.getTime() - uilchluulegch.tuukh[0].tsagiinTuukh[0].orsonTsag);
    let niitMinut = Math.floor(diff / (1000 * 60));
    if (!!zogsool.dotorZogsooliinId && !!uilchluulegch.tuukh && uilchluulegch.tuukh.length > 1) {
      var dotorZogsool = await (Parking as any)(tukhainBaaziinKholbolt).findById(zogsool.dotorZogsooliinId);
      var zoruu = Math.abs(odoo.getTime() - uilchluulegch.tuukh[1].tsagiinTuukh[0].orsonTsag);
      dotorZogsoolMinut = Math.floor(zoruu / (1000 * 60));
      if (dotorZogsool?.tulburuud?.length > 0) {
        dotorZogsoolDun = await tulburBodoy(
          dotorZogsool.tulburuud,
          odoo.getTime(),
          uilchluulegch.tuukh[1].tsagiinTuukh[0].orsonTsag,
          dotorZogsool.undsenUne,
          dotorZogsool.undsenMin,
          0,
          undefined,
        );
      } else {
        const time = dotorZogsool.undsenMin ? 30 : 60;
        let tsag = Math.ceil(niitMinut / time);
        dotorZogsoolDun = tsag * dotorZogsool.undsenUne;
      }
    }
    if (zogsool?.tulburuud?.length > 0) {
      dun = await tulburBodoy(
        zogsool.tulburuud,
        odoo.getTime(),
        uilchluulegch.tuukh[0].tsagiinTuukh[0].orsonTsag,
        zogsool.undsenUne,
        zogsool.undsenMin,
        dotorZogsoolMinut,
        undefined,
      );
    } else {
      const time = zogsool.undsenMin ? 30 : 60;
      let tsag = Math.ceil(niitMinut / time);
      dun = tsag * zogsool.undsenUne;
    }
    if (dotorZogsoolDun > 0) dun = dun + dotorZogsoolDun;
    dun = uilchluulegch.turul !== 'Үнэгүй' && uilchluulegch.turul !== 'Дотоод' ? dun : 0;
    if (
      uilchluulegch.turul === 'Гэрээт' &&
      uilchluulegch?.mashin?.ekhlekhOgnoo &&
      uilchluulegch?.mashin?.duusakhOgnoo
    ) {
      if (
        moment(new Date()).diff(uilchluulegch?.mashin?.ekhlekhOgnoo, 'd') >= 0 &&
        moment(uilchluulegch?.mashin?.duusakhOgnoo).diff(new Date(), 'd') >= 0
      ) {
        dun = 0;
      }
    } else if (uilchluulegch.turul === 'Түрээслэгч' && uilchluulegch.mashin.tuluv !== 'Харилцагч') {
      if (uilchluulegch.mashin.tuluv === 'Үнэгүй') {
        dun = 0;
      } else if (uilchluulegch.mashin.tuluv === 'Хөнгөлөлттэй') {
        if (uilchluulegch.mashin.khungulultTurul === 'khuviKhungulult' && uilchluulegch.mashin.khungulult) {
          dun = Math.ceil(dun - (dun / 100) * uilchluulegch.mashin.khungulult);
        }
        if (
          uilchluulegch.mashin.khungulultTurul === 'togtmolTsag' &&
          ((zogsool.baiguullagiinId === '63c0f31efe522048bf02086d' &&
            !!uilchluulegch.mashin.zogsooliinTurul &&
            (uilchluulegch.mashin.zogsooliinTurul === 'Бүгд' ||
              (uilchluulegch.mashin.zogsooliinTurul === 'Гадна' && !!zogsool.dotorZogsooliinId) ||
              (uilchluulegch.mashin.zogsooliinTurul === 'Дотор' && !!zogsool.gadnaZogsooliinId))) ||
            zogsool?.baiguullagiinId !== '63c0f31efe522048bf02086d')
        ) {
          if (uilchluulegch.mashin.tsagiinTurul === 'Өдрөөр' || uilchluulegch.mashin.tsagiinTurul === 'Сараар') {
            const khugatsaaniiZuruu =
              (zogsool.tulburuud[0].tariff[0].tulbur == 0 ? zogsool.tulburuud[0].tariff[0].minut : 0) - niitMinut;
            if (khugatsaaniiZuruu >= 0) {
              dun = 0;
            } else {
              if (uilchluulegch.mashin.uldegdelKhungulukhKhugatsaa - Math.abs(khugatsaaniiZuruu) >= 0) {
                dun = 0;
              }
              if (uilchluulegch.mashin.uldegdelKhungulukhKhugatsaa - Math.abs(khugatsaaniiZuruu) < 0) {
                const zuruuMinut = Math.abs(
                  Math.floor(uilchluulegch.mashin.uldegdelKhungulukhKhugatsaa - Math.abs(niitMinut)),
                );
                if (zogsool?.tulburuud?.length > 0) {
                  dun = await tulburBodoy(
                    zogsool.tulburuud,
                    odoo.getTime(),
                    uilchluulegch.tuukh[0].tsagiinTuukh[0].orsonTsag,
                    zogsool.undsenUne,
                    zogsool.undsenMin,
                    dotorZogsoolMinut,
                    zuruuMinut,
                  );
                } else {
                  const time = zogsool.undsenMin ? 30 : 60;
                  let tsag = Math.ceil(zuruuMinut / time);
                  dun = tsag * zogsool.undsenUne;
                }
              }
            }
          }
        }
      }
    } else if (uilchluulegch.turul === 'Түрээслэгч' && uilchluulegch.mashin.tuluv === 'Харилцагч') {
      if (uilchluulegch.mashin.nemeltTuluv === 'Үнэгүй') {
        dun = 0;
      } else if (uilchluulegch.mashin.nemeltTuluv === 'Хөнгөлөлттэй') {
        if (uilchluulegch.mashin.khungulultTurul === 'khuviKhungulult' && uilchluulegch.mashin.khungulult) {
          dun = Math.ceil(dun - (dun / 100) * uilchluulegch.mashin.khungulult);
        }
        if (uilchluulegch.mashin.khungulultTurul === 'togtmolTsag') {
          if (uilchluulegch.mashin.tsagiinTurul === 'Өдрөөр' || uilchluulegch.mashin.tsagiinTurul === 'Сараар') {
            const khugatsaaniiZuruu =
              (zogsool?.tulburuud?.length > 0 &&
              zogsool?.tulburuud[0].tariff?.length > 0 &&
              zogsool?.tulburuud[0].tariff[0].tulbur == 0
                ? zogsool?.tulburuud[0].tariff[0].minut || 0
                : 0) - niitMinut;
            if (khugatsaaniiZuruu >= 0) {
              dun = 0;
            } else {
              if (uilchluulegch.mashin.uldegdelKhungulukhKhugatsaa - Math.abs(khugatsaaniiZuruu) >= 0) {
                dun = 0;
              }
              if (uilchluulegch.mashin.uldegdelKhungulukhKhugatsaa - Math.abs(khugatsaaniiZuruu) < 0) {
                const zuruuMinut = Math.abs(
                  Math.floor(uilchluulegch.mashin.uldegdelKhungulukhKhugatsaa - Math.abs(khugatsaaniiZuruu)),
                );
                if (zogsool?.tulburuud?.length > 0) {
                  dun = await tulburBodoy(
                    zogsool.tulburuud,
                    odoo.getTime(),
                    uilchluulegch.tuukh[0].tsagiinTuukh[0].orsonTsag,
                    zogsool.undsenUne,
                    zogsool.undsenMin,
                    dotorZogsoolMinut,
                    zuruuMinut,
                  );
                } else {
                  const time = zogsool.undsenMin ? 30 : 60;
                  let tsag = Math.ceil(zuruuMinut / time);
                  dun = tsag * zogsool.undsenUne;
                }
              }
            }
          }
        }
      }
    }
    if (dun > 0) {
      var tulsunDun = 0;
      for await (const tuukh of uilchluulegch.tuukh) {
        if (!!tuukh.tulbur && tuukh.tulbur.length > 0)
          for await (const tulbur of tuukh.tulbur) {
            tulsunDun = tulsunDun + tulbur.dun;
          }
      }
      if (tulsunDun > 0) {
        dun = dun - tulsunDun;
      }
      if (dun < 0) dun = 0;
    }
    return dun;
  } catch (error: any) {
    throw new Error(error);
  }
}

const tulburBodoy = async (
  tulburuud: any,
  garakh: number,
  orson: number,
  undsenUne: number,
  undsenMin: boolean,
  dotorZogsoolMinut: number,
  zuruuMinut: any,
  zuvkhunMinutaar: boolean = false,
) => {
  let dun = 0;
  const diff = Math.abs(garakh - orson);
  let niitMinut = zuruuMinut ? zuruuMinut : Math.floor(diff / (1000 * 60));
  const seconds = async (t: any) => {
    const tt = moment(t).format('HH:mm');
    let [tsag, min] = tt.split(':').map(Number);
    return tsag * 3600 + min * 60;
  };
  const tariffTootsokh = async (v: any, min: number) => {
    let maxMin = v[v.length - 1]?.minut;
    let tariff = 0;
    for await (const z of v) {
      tariff = z.tulbur;
      if (min <= z.minut) break;
    }
    if (min > maxMin) {
      const time = undsenMin ? 30 : 60;
      let tsag = Math.ceil((min - maxMin) / time);
      tariff = tsag * undsenUne + tariff;
    }
    return tariff;
  };
  const tulburuudTootsokh = async (orsonSec: number, garsanSec: number, gantsXuwiartai: boolean = false) => {
    let tulbur = 0;
    for await (const x of tulburuud) {
      const zStartSec = await seconds(x.tsag[0]);
      const zEndSec = await seconds(x.tsag[1]);
      x.tariff.sort((a: any, b: any) => a.minut - b.minut);
      if (zEndSec < zStartSec) {
        const isInOvernight =
          (orsonSec >= zStartSec && orsonSec <= 86400) ||
          (orsonSec >= 0 && orsonSec <= zEndSec) ||
          (garsanSec >= zStartSec && garsanSec <= 86400) ||
          (garsanSec >= 0 && garsanSec <= zEndSec) ||
          (orsonSec <= zStartSec && garsanSec >= zEndSec);

        if (isInOvernight) {
          let overlapStart = orsonSec;
          if (orsonSec < zStartSec) overlapStart = zStartSec;
          if (garsanSec <= zEndSec) {
            const bsanMin = (garsanSec + (86400 - overlapStart)) / 60;
            const tariff = await tariffTootsokh(x.tariff, bsanMin);
            if (tariff > 0) tulbur += tariff;
          } else {
            const bsanMin = (86400 - overlapStart) / 60;
            const tariff = await tariffTootsokh(x.tariff, bsanMin);
            if (tariff > 0) tulbur += tariff;
          }
        }
      } else {
        if (zStartSec <= orsonSec && zEndSec >= orsonSec && zEndSec >= garsanSec) {
          var bsanMin: number = 0;
          if (!!gantsXuwiartai) bsanMin = zuruuMinut ? zuruuMinut : (zEndSec - orsonSec + (garsanSec - zStartSec)) / 60;
          else bsanMin = zuruuMinut ? zuruuMinut : (garsanSec - orsonSec) / 60;
          const tariff = await tariffTootsokh(x.tariff, bsanMin);
          if (tariff > 0) tulbur = tariff;
          break;
        } else if (zStartSec <= orsonSec && zEndSec >= orsonSec && zEndSec <= garsanSec) {
          const bsanMin = Math.trunc(zuruuMinut ? zuruuMinut : (zEndSec - orsonSec) / 60);
          const tariff = await tariffTootsokh(x.tariff, bsanMin);
          if (tariff > 0) tulbur = tulbur + tariff;
        } else if (orsonSec < zStartSec && zStartSec < garsanSec && zEndSec >= garsanSec) {
          const bsanMin = zuruuMinut ? zuruuMinut : (garsanSec - zStartSec) / 60;
          const tariff = await tariffTootsokh(x.tariff, bsanMin);
          if (tariff > 0) tulbur = tulbur + tariff;
        } else if (orsonSec < zStartSec && zEndSec < garsanSec) {
          const bsanMin = zuruuMinut ? zuruuMinut : (zEndSec - zStartSec) / 60;
          const tariff = await tariffTootsokh(x.tariff, bsanMin);
          if (tariff > 0) tulbur = tulbur + tariff;
        }
      }
    }
    return tulbur;
  };
  let orsonSec = await seconds(orson);
  let garsanSec = await seconds(garakh);
  var gantsXuwiartai = false;
  if (tulburuud.length == 1) gantsXuwiartai = true;
  if (dotorZogsoolMinut > 0) {
    const niitSec = (niitMinut - dotorZogsoolMinut) * 60;
    niitMinut = niitMinut - dotorZogsoolMinut;
    if (niitMinut < 1440 && niitSec < garsanSec) {
      orsonSec = garsanSec - niitSec;
    }
  }
  if (orsonSec > garsanSec) {
    let dun1 = 0;
    let dun2 = 0;
    if (dotorZogsoolMinut > 0) {
      if (niitMinut < 1440) {
        const niitSec = niitMinut * 60;
        dun1 = await tulburuudTootsokh(86400 - niitSec, 86400);
      } else {
        const zurvv = (niitMinut % 1440) * 60;
        dun1 = await tulburuudTootsokh(86400 - zurvv, 86400);
      }
    } else {
      if (!!gantsXuwiartai) {
        dun1 = await tulburuudTootsokh(orsonSec, garsanSec, true);
        dun2 = 0;
      } else {
        dun1 = await tulburuudTootsokh(orsonSec, 86400);
        dun2 = await tulburuudTootsokh(0, garsanSec);
      }
    }
    if (niitMinut < 1440) {
      dun = dun1 + dun2;
    } else {
      const khonog = Math.trunc(niitMinut / 1440);
      const khonogDun = await tulburuudTootsokh(0, 86400);
      dun = khonogDun * khonog + dun1 + dun2;
    }
  } else {
    if (niitMinut < 1440) {
      if (!zuvkhunMinutaar) {
        dun = await tulburuudTootsokh(orsonSec, garsanSec);
      } else {
        const zurvv = (niitMinut % 1440) * 60;
        dun = await tulburuudTootsokh(86400 - zurvv, 86400);
      }
    } else {
      let dun1 = 0;
      if (dotorZogsoolMinut > 0) {
        const zurvv = (niitMinut % 1440) * 60;
        dun1 = await tulburuudTootsokh(86400 - zurvv, 86400);
      } else {
        dun1 = await tulburuudTootsokh(orsonSec, garsanSec);
      }
      const khonog = Math.trunc(niitMinut / 1440);
      const khonogDun = await tulburuudTootsokh(0, 86400);
      dun = khonogDun * khonog + dun1;
    }
  }
  return dun;
};

const tokiIlgeeye = async (zogsool: any, uilchluulegch: any, turul: string, erunkhiiKholbolt: any) => {
  var tokiMashin = await TokiMashin.find(uilchluulegch.mashiniiDugaar);
  if (!!tokiMashin) {
    var tokenObject: any = await (Token as any)(erunkhiiKholbolt).findOne({
      turul: 'toki',
      token: { $exists: true },
      expires_in: { $gte: new Date() },
    });
    var token = '';
    if (!tokenObject) {
      tokenObject = await tokiTokenAvya(erunkhiiKholbolt);
      token = tokenObject.access_token;
    } else token = tokenObject.token;
    var url = process.env.TOKI_SERVER + '/gate/v1/' + (turul == 'garakh' ? 'out' : 'in');
    var date = moment(uilchluulegch.tuukh[0].tsagiinTuukh[0].orsonTsag).format('YYYY/MM/DD HH:mm:ss');
    if (turul == 'garakh')
      date = moment(uilchluulegch.tuukh[0].tsagiinTuukh[0].garsanTsag).format('YYYY/MM/DD HH:mm:ss');
    var data: any = {
      req_3rd_party: process.env.TOKI_3RD_PARTY,
      request_id: '123',
      session_id: uilchluulegch._id,
      parkingId: zogsool._id,
      plate_number: uilchluulegch.mashiniiDugaar,
      date,
    };
    if (turul == 'garakh') {
      data.invoice_amount = uilchluulegch.niitDun;
      data.paid = uilchluulegch.niitDun > 0 ? false : true;
    }
    try {
      var response = await axios.post(url, data, {
        headers: {
          Authorization: 'Bearer ' + token,
        },
      });
      if (
        turul == 'garakh' &&
        response &&
        response.data &&
        response.data.success &&
        response.data.data &&
        response.data.data.pay_type &&
        response.data.data.pay_type == 'post_pay'
      ) {
        return response.data.data.bill_id;
      } else return null;
    } catch (err) {
      return null;
    }
  }
};

const tokiTokenAvya = async (erunkhiiKholbolt: any) => {
  try {
    var url = process.env.TOKI_SERVER + '/gate/v1/token';
    const response = await axios.post(url, null, {
      auth: {
        username: process.env.TOKI_USERNAME ? process.env.TOKI_USERNAME : '',
        password: process.env.TOKI_PASSWORD ? process.env.TOKI_PASSWORD : '',
      },
    });
    var khariu = response.data;
    khariu = khariu.data;
    (Token as any)(erunkhiiKholbolt)
      .updateOne(
        { turul: 'toki' },
        { ognoo: new Date(), token: khariu.access_token, expires_in: new Date(new Date().getTime() + 604800000) }, //7 xonog
        { upsert: true },
      )
      .catch((e: any) => {
        throw e;
      });
    return khariu;
  } catch (error) {
    throw error;
  }
};

function gereetZuruuMinutBodyo(
  orson: Date,
  garsan: Date,
  tulburBodokhTsagEkhlekh: String,
  tulburBodokhTsagDuusakh: String,
) {
  const orsonUdur = moment(orson);
  const garsanUdur = moment(garsan);
  //garsanUdur.subtract(1, 'minute');

  const tootsokhEkhlekh = moment(orson)
    .set('hour', parseInt(tulburBodokhTsagEkhlekh.split(':')[0], 10))
    .set('minute', parseInt(tulburBodokhTsagEkhlekh.split(':')[1], 10));
  const tootsokhDuusakh = moment(orson)
    .set('hour', parseInt(tulburBodokhTsagDuusakh.split(':')[0], 10))
    .set('minute', parseInt(tulburBodokhTsagDuusakh.split(':')[1], 10));

  let zuruuMinut = 0;

  while (orsonUdur.isBefore(garsanUdur)) {
    if (orsonUdur.isBetween(tootsokhEkhlekh, tootsokhDuusakh, undefined, '[]')) {
      zuruuMinut += 1;
    }
    orsonUdur.add(1, 'minute');
  }

  return zuruuMinut;
}
