export type HospitalRecord={name:string;pos:[number,number];beds:number;label:string};
export type PatientRecord={condition:string;name:string;address:string;identityFile:File|null};
export type DashboardRole='reporter'|'nurse'|'ambulance'|'callcenter'|'hospital'|'admin';
export function dashboardRoles():DashboardRole[]{return ['reporter','nurse','ambulance','callcenter','hospital','admin'];}
export function dashboardEntryCards(){return [
 {role:'reporter' as const,title:'Pelapor',description:'Panic button, laporan, kamera bertimestamp, serta pelacakan'},
 {role:'nurse' as const,title:'Perawat',description:'Data dan riwayat kondisi serta identitas korban'},
 {role:'ambulance' as const,title:'Ambulance',description:'Tracking ambulans, rumah sakit, dan tombol mulai perjalanan'},
 {role:'callcenter' as const,title:'Call Center 112',description:'Verifikasi laporan dan penentuan ambulans serta IGD'},
 {role:'hospital' as const,title:'Rumah sakit',description:'Rujukan masuk dan kapasitas IGD'},
 {role:'admin' as const,title:'Admin',description:'Tracking seluruh pengguna dan operasional sistem'},
];}

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

export function formatEta(seconds:number){
 const safe=Math.max(0,Math.ceil(seconds));
 return `${String(Math.floor(safe/60)).padStart(2,'0')}:${String(safe%60).padStart(2,'0')}`;
}

export function positionAlongRoute(route:[number,number][],progress:number):[number,number]{
 if(route.length===0)return [0,0];
 if(route.length===1)return route[0];
 const lengths=route.slice(1).map((point,index)=>distanceKm(route[index],point));
 const total=lengths.reduce((sum,length)=>sum+length,0);
 let target=Math.max(0,Math.min(1,progress))*total;
 for(let index=0;index<lengths.length;index++){
  if(target<=lengths[index]||index===lengths.length-1){
   const ratio=lengths[index]===0?0:target/lengths[index];
   return [route[index][0]+(route[index+1][0]-route[index][0])*ratio,route[index][1]+(route[index+1][1]-route[index][1])*ratio];
  }
  target-=lengths[index];
 }
 return route[route.length-1];
}
