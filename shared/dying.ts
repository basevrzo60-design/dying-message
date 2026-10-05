export type Phase='lobby'|'reveal'|'guard'|'kill'|'real_clue'|'detective'|'fake_clues'|'discussion'|'vote'|'round_end'|'result';
export type Role='murderer'|'professional'|'detective'|'celebrity'|'noble'|'guard'|'innocent';
export const roleInfo:Record<Role,{name:string;team:'murderer'|'innocents';ability:string}>={
 murderer:{name:'ฆาตกร',team:'murderer',ability:'เลือกเหยื่อ 1 คนต่อรอบ และเพิ่มเบาะแสลวง 2 ใบ'},
 professional:{name:'ฆาตกรมืออาชีพ',team:'murderer',ability:'เลือกเหยื่อ 1 คนต่อรอบ และเพิ่มเบาะแสลวง 3 ใบ'},
 detective:{name:'นักสืบเอกชน',team:'innocents',ability:'หากยังมีชีวิต เห็นเบาะแสจริงก่อนฆาตกรวางเบาะแสลวง'},
 celebrity:{name:'ผู้มีชื่อเสียง',team:'innocents',ability:'หากถูกฆาตกรฆ่า เบาะแสลวงในรอบนั้นลดลง 1 ใบ'},
 noble:{name:'ขุนนาง',team:'innocents',ability:'หากถูกฆาตกรฆ่า เลือกเบาะแสจริงได้ 2 ใบ'},
 guard:{name:'สุนัขเฝ้ายาม',team:'innocents',ability:'ก่อนฆาตกรลงมือ เลือกปกป้องผู้เล่นอื่น 1 คนต่อรอบ'},
 innocent:{name:'พลเมือง',team:'innocents',ability:'ไม่มีพลังพิเศษ ร่วมสืบและโหวตหาฆาตกร'},
};
export function castFor(count:number):Role[]{
 if(!Number.isInteger(count)||count<4||count>8)throw Error('รองรับผู้เล่น 4–8 คน');
 const cast:Role[]=[count===8?'professional':'murderer','detective','innocent','innocent'];
 if(count>=5)cast.push('celebrity');
 if(count>=6)cast.push('noble');
 if(count>=7)cast.push('guard');
 if(count>=8)cast.push('innocent');
 return cast;
}
export type Evidence={id:number;icon:string;name:string};
const evidenceCatalog:[string,string][]=[
['Glasses','แว่นตา'],['Watch','นาฬิกา'],['HardHat','หมวก'],['Footprints','รองเท้า'],['KeyRound','กุญแจ'],['Smartphone','โทรศัพท์'],['Camera','กล้องถ่ายรูป'],['Gem','แหวน'],['Hand','ถุงมือ'],['Wind','ผ้าพันคอ'],
['Backpack','กระเป๋า'],['Coffee','กาแฟ'],['Flower2','ดอกไม้'],['Headphones','หูฟัง'],['BookOpen','หนังสือ'],['Mail','จดหมาย'],['Flame','เทียน'],['Car','รถยนต์'],['Candy','ลูกอม'],['Cat','แมว'],
['Moon','พระจันทร์'],['Music','ดนตรี'],['CircleDot','ลูกบอล'],['ScanFace','กระจก'],['CloudRain','ฝน'],['BriefcaseBusiness','กระเป๋างาน'],['Baby','ตุ๊กตา'],['Apple','แอปเปิล'],['CircleDollarSign','เหรียญ'],['Pencil','ดินสอ'],
['Puzzle','จิ๊กซอว์'],['Flashlight','ไฟฉาย'],['Umbrella','ร่ม'],['Sword','มีด'],['Scissors','กรรไกร'],['BottleWine','ขวด'],['Wine','แก้วไวน์'],['Cigarette','บุหรี่'],['SportShoe','รอยเท้า'],['FingerprintPattern','ลายนิ้วมือ'],
['Link','โซ่'],['Shield','กุญแจมือ'],['Lasso','เชือก'],['Compass','เข็มทิศ'],['Map','แผนที่'],['Ticket','ตั๋ว'],['Spade','ไพ่'],['Dices','ลูกเต๋า'],['Drama','หน้ากาก'],['Crown','มงกุฎ'],
['Badge','เข็มกลัด'],['Sparkles','สร้อยคอ'],['Diamond','ต่างหู'],['Brush','หวี'],['PenLine','ลิปสติก'],['SprayCan','น้ำหอม'],['Wallet','กระเป๋าสตางค์'],['Banknote','ธนบัตร'],['FileText','เอกสาร'],['Newspaper','หนังสือพิมพ์'],
['Pen','ปากกา'],['PaintBucket','หมึก'],['Pill','ยา'],['Syringe','เข็มฉีดยา'],['Bandage','พลาสเตอร์'],['Skull','กะโหลก'],['Bone','กระดูก'],['Droplets','หยดสีแดง'],['FireExtinguisher','ถังดับเพลิง'],['Snowflake','หิมะ'],
['Leaf','ใบไม้'],['TreePine','ต้นไม้'],['Sun','ดวงอาทิตย์'],['Star','ดาว'],['Cloud','เมฆ'],['Zap','สายฟ้า'],['WavesHorizontal','คลื่น'],['Anchor','สมอ'],['Ship','เรือ'],['Plane','เครื่องบิน'],
['TrainFront','รถไฟ'],['Bike','จักรยาน'],['House','บ้าน'],['Hotel','โรงแรม'],['DoorOpen','ประตู'],['PanelsTopLeft','หน้าต่าง'],['BedDouble','เตียง'],['Bath','อ่างอาบน้ำ'],['Amphora','แจกัน'],['Image','รูปภาพ']
];
export const evidence:Evidence[]=evidenceCatalog.map(([icon,name],id)=>({id,icon,name}));
export type PublicPlayer={id:string;name:string;connected:boolean;ready:boolean;alive:boolean};
export type VoteSummary={accusedId:string|null;tied:boolean;counts:{id:string;count:number}[];caught:boolean};
export type View={code:string;name:string;capacity:number;hostId:string;phase:Phase;round:number;paused:boolean;players:PublicPlayer[];victimId:string|null;clueChoices:Evidence[];revealedClues:Evidence[];realClueCount:number;fakeClueCount:number;voteCount:number;me:{id:string;role:Role|null;confirmed:boolean;alive:boolean;isVictim:boolean;secretMurdererId:string|null;realClueIds:number[];protectedId:string|null;hasVoted:boolean};summary:VoteSummary|null;winner:'innocents'|'murderer'|null;murdererId:string|null};
