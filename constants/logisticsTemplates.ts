export const LOGISTICS_TEMPLATES = {
    '抓周派對 (Zhuazhou Party)': [
        { time: '09:00', action: '抵達現場 (Arrive)' },
        { time: '09:30', action: '架設抓周道具 (Setup Props)' },
        { time: '10:00', action: '準備虎衣虎鞋 (Prepare Costumes)' },
        { time: '10:30', action: '確認流程與動線 (Check Flow)' },
        { time: '11:00', action: '引導儀式開始 (Start Ceremony)' },
        { time: '12:00', action: '撤場確認 (Teardown Check)' }
    ],
    '外燴Buffet (Catering Buffet)': [
        { time: '10:00', action: '後勤出發 (Depart)' },
        { time: '11:00', action: '抵達/卸貨 (Arrive/Unload)' },
        { time: '11:15', action: '架設餐台與保溫 (Setup Buffet Line)' },
        { time: '11:45', action: '餐點上架確認 (Food Ready)' },
        { time: '12:00', action: '開始供餐 (Service Start)' },
        { time: '13:30', action: '巡場與補餐 (Refill)' },
        { time: '14:00', action: '收餐與清潔 (Teardown/Clean)' },
        { time: '14:30', action: '撤場完成 (Leave)' }
    ],
    '外燴點心 (Catering Snacks)': [
        { time: '13:00', action: '後勤出發 (Depart)' },
        { time: '13:45', action: '抵達/卸貨 (Arrive/Unload)' },
        { time: '14:00', action: '點心盤擺設 (Setup Snacks)' },
        { time: '14:30', action: '享用時間 (Service Start)' },
        { time: '16:00', action: '收餐與清潔 (Teardown)' }
    ],
    '內用Buffet (Dine-in Buffet)': [
        { time: '11:00', action: '廚房備餐完成 (Kitchen Ready)' },
        { time: '11:30', action: '前台Buffet線架設 (Setup Line)' },
        { time: '11:45', action: '餐具與動線確認 (Check Cutlery)' },
        { time: '12:00', action: '開放取餐 (Open)' },
        { time: '13:30', action: '整理餐台 (Tidy up)' },
        { time: '14:30', action: '餐期結束/清理 (End/Clean)' }
    ],
    '內用點心 (Dine-in Snacks)': [
        { time: '14:00', action: '準備點心與茶水 (Prepare)' },
        { time: '14:30', action: '出餐擺盤 (Plating)' },
        { time: '17:00', action: '收拾 (Clean up)' }
    ],
    '西式餐盒(自取) (Box Meal - Pickup)': [
        { time: '09:30', action: '摺紙盒準備 (Fold Boxes)' },
        { time: '10:30', action: '餐點製作完成 (Food Ready)' },
        { time: '11:00', action: '分裝/擺盤 (Packing)' },
        { time: '11:30', action: '封箱與核對數量 (Seal & Check)' },
        { time: '12:00', action: '等待客戶取餐 (Wait for Pickup)' }
    ],
    '西式餐盒(外送) (Box Meal - Delivery)': [
        { time: '09:30', action: '摺紙盒準備 (Fold Boxes)' },
        { time: '10:00', action: '分裝/擺盤 (Packing)' },
        { time: '10:30', action: '封箱與核對 (Seal & Check)' },
        { time: '10:45', action: '裝車 (Load Video)' },
        { time: '11:00', action: '出發外送 (Depart)' }
    ],
    '街吧派對 (Street Bar)': [
        { time: '17:00', action: '抵達現場 (Arrive)' },
        { time: '17:30', action: '吧台與Logo架設 (Setup Bar)' },
        { time: '18:00', action: '酒水冰鎮與備料 (Prep Drinks)' },
        { time: '18:30', action: '活動開始/調酒服務 (Service Start)' },
        { time: '21:30', action: '最後點單 (Last Call)' },
        { time: '22:00', action: '撤吧與場復 (Teardown)' }
    ]
};
