import Parking from '../model/parking';

export async function zogsoolUusgey(body: any) {
    const zogsool = new (Parking as any)(body.tukhainBaaziinKholbolt)();
    zogsool.ner = body.ner;
    zogsool.gadnaZogsooliinId = body.gadnaZogsooliinId;
    zogsool.baiguullagiinId = body.tukhainBaaziinKholbolt.baiguullagiinId;
    zogsool.tulbur = body.tulbur;
    zogsool.too = body.too;
    zogsool.khaalga = body.khaalga;
    zogsool.save();
    return 'Amjilttai'
}
