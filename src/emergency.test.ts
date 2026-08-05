import {describe,expect,it} from 'vitest';
import {nearestAvailableHospital,patientRecordIsValid} from './emergency';

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
