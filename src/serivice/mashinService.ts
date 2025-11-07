import Mashin from '../model/mashin';

export async function mashiniiToo(body: any) {
    const query = [
        {
            $match: {
                baiguullagiinId: body.baiguullagiinId,
            },
        },
        {
            $group: {
                _id: "$turul",
                too: {
                    $sum: 1,
                },
            },
        },
    ];
    Mashin(body.tukhainBaaziinKholbolt)
        .aggregate(query)
        .then((result: any) => {
            return result;
        })
        .catch((err: any) => {
            throw err;
        });
}
