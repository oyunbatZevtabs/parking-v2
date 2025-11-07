import moment = require('moment');
import Uilchluulegch from '../model/uilchluulegch';

export async function uilchluulegchdiinToo(body: any) {
  const query = [
    {
      $match: {
        baiguullagiinId: body.baiguullagiinId,
        barilgiinId: body.barilgiinId,
        createdAt: {
          $gte: new Date(body.ekhlekhOgnoo),
          $lte: new Date(body.duusakhOgnoo),
        },
      },
    },
    {
      $facet: {
        turul: [
          {
            $group: {
              _id: '$turul',
              too: {
                $sum: 1,
              },
            },
          },
        ],
        tuluv: [
          {
            $unwind: '$tuukh',
          },
          {
            $group: {
              _id: '$tuukh.tuluv',
              too: {
                $sum: 1,
              },
            },
          },
        ],
      },
    },
  ];
  return await Uilchluulegch(body.tukhainBaaziinKholbolt).aggregate(query);
}

export async function zogsoolTusBurUilchluulegchdiinToo(body: any) {
  const query = [
    {
      $match: {
        createdAt: {
          $gte: new Date(body.ekhlekhOgnoo),
          $lte: new Date(body.duusakhOgnoo),
        },
        baiguullagiinId: body.baiguullagiinId,
      },
    },
    {
      $unwind: { path: '$tuukh' },
    },
    {
      $match: {
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
  return await Uilchluulegch(body.tukhainBaaziinKholbolt).aggregate(query);
}

export async function uilchluulegchdiinDun(body: any) {
  const query = [
    {
      $match: {
        check_in_time: {
          $gte: new Date(body.ekhlekhOgnoo),
          $lte: new Date(body.duusakhOgnoo),
        },
        baiguullagiinId: body.baiguullagiinId,
      },
    },
    {
      $group: {
        _id: 'aa',
        too: {
          $sum: '$tulbur',
        },
      },
    },
  ];
  Uilchluulegch(body.tukhainBaaziinKholbolt)
    .aggregate(query)
    .then((result: any) => {
      if (result && result.length > 0) return result[0].too.toString();
      else return '0';
    });
}

export async function uilchluulegchTseverliy(body: any) {
  const zasakhKhereglegchid: any[] = [...body.utguud];

  const songogdsonKhereglegchid = await Uilchluulegch(body.tukhainBaaziinKholbolt).find({
    _id: { $in: zasakhKhereglegchid },
  });

  for (const x of songogdsonKhereglegchid) {
    if (!x.tuukh || !x.tuukh[0]) {
      return new Error(`${x.mashiniiDugaar}-тай үйлчлүүлэгч мэдээлэл буруу байна!`);
    }
    if (!!x.tuukh[0].tsagiinTuukh[0].garsanTsag) {
      return new Error(`${x.mashiniiDugaar}-тай үйлчлүүлэгч гарсан байна!`);
    }
  }

  try {
    const result = await Uilchluulegch(body.tukhainBaaziinKholbolt)
      .updateMany(
        { _id: { $in: zasakhKhereglegchid }, 'tuukh.0.garsanKhaalga': { $exists: false } },
        {
          $set: {
            'tuukh.0.garsanKhaalga': 'tseverlesen',
            'tuukh.0.tsagiinTuukh.0.garsanTsag': new Date(),
            'tuukh.0.tuluv': -3, //Tseverlesen tuluv
            zurchil: body.shaltgaan,
          },
        },
      )
      .exec();

    return 'Amjilttai';
  } catch (err: any) {
    console.error('Update khiikhed aldaa:', err);
    return new Error(err);
  }
}
