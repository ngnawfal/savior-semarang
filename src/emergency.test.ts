import {describe,expect,it} from 'vitest';
import {dashboardEntryCards,dashboardRoles,formatEta,nearestAvailableHospital,patientRecordIsValid,positionAlongRoute} from './emergency';

const hospitals=[
 {name:'Penuh dekat',pos:[-6.99,110.42] as [number,number],beds:0,label:'penuh'},
 {name:'Kosong terdekat',pos:[-6.993,110.409] as [number,number],beds:2,label:'tersedia'},
 {name:'Kosong jauh',pos:[-7.02,110.46] as [number,number],beds:5,label:'tersedia'},
];

describe('nearestAvailableHospital',()=>{
 it('mengabaikan IGD penuh dan memilih IGD tersedia terdekat',()=>{
  expect(nearestAvailableHospital([-6.989,110.423],hospitals)?.name).toBe('Kosong terdekat');
 });
});

describe('patientRecordIsValid',()=>{
 it('tetap valid tanpa nama, alamat, atau identitas jika kondisi pasien tidak memungkinkan',()=>{
  expect(patientRecordIsValid({condition:'Tidak sadar',name:'',address:'',identityFile:null})).toBe(true);
 });
 it('memerlukan kondisi pasien',()=>{
  expect(patientRecordIsValid({condition:'',name:'Budi',address:'Semarang',identityFile:null})).toBe(false);
 });
});

describe('dashboard terpisah',()=>{
 it('menyediakan lima dashboard sesuai peran',()=>{
  expect(dashboardRoles()).toEqual(['callcenter','reporter','nurse','hospital','admin']);
 });
 it('menampilkan kelima pilihan masuk pada halaman awal',()=>{
  expect(dashboardEntryCards().map(card=>card.role)).toEqual(dashboardRoles());
  expect(dashboardEntryCards()).toHaveLength(5);
 });
});

describe('simulasi perjalanan ambulans',()=>{
 it('ETA menghitung mundur dan berhenti di nol',()=>{
  expect(formatEta(372)).toBe('06:12');
  expect(formatEta(-3)).toBe('00:00');
 });
 it('posisi bergerak mengikuti keseluruhan ruas rute',()=>{
  const route:[[number,number],[number,number],[number,number]]=[[0,0],[0,1],[0,3]];
  expect(positionAlongRoute(route,0)).toEqual([0,0]);
  expect(positionAlongRoute(route,0.5)).toEqual([0,1.5]);
  expect(positionAlongRoute(route,1)).toEqual([0,3]);
 });
});
