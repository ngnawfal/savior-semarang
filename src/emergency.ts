export type HospitalRecord={name:string;pos:[number,number];beds:number;label:string};
export type PatientRecord={condition:string;name:string;address:string;identityFile:File|null};

function distanceKm(a:[number,number],b:[number,number]){
 const rad=(value:number)=>value*Math.PI/180;
 const dLat=rad(b[0]-a[0]); const dLon=rad(b[1]-a[1]);
 const x=Math.sin(dLat/2)**2+Math.cos(rad(a[0]))*Math.cos(rad(b[0]))*Math.sin(dLon/2)**2;
 return 6371*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
}
export function nearestAvailableHospital(origin:[number,number],hospitals:HospitalRecord[]){
 return hospitals.filter(h=>h.beds>0).sort((a,b)=>distanceKm(origin,a.pos)-distanceKm(origin,b.pos))[0];
}
export function patientRecordIsValid(record:PatientRecord){return record.condition.trim().length>0;}
