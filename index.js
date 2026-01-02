require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { 
    Client, GatewayIntentBits, ActivityType, PermissionsBitField, 
    ChannelType, Collection, StringSelectMenuBuilder, EmbedBuilder, 
    AuditLogEvent, ActionRowBuilder, MessageFlags, ButtonBuilder, 
    PermissionFlagsBits, ButtonStyle, time, ModalBuilder, TextInputBuilder, TextInputStyle, OverwriteType 
} = require('discord.js');

// เรียกใช้ Model และ Config
const User = require('./models/User'); 
const { products, farmPackages } = require('./config.js');

// ================= 1. ตั้งค่า Server (Dummy Server สำหรับ Render) =================
const app = express();
const port = process.env.PORT || 10000;

app.use(express.json());

// 🟢 [เพิ่มตรงนี้ 2] กำหนดรหัสลับ (ควรตรงกับเว็บควบคุม)
const API_SECRET = process.env.API_SECRET || "P.Pedz"; 

app.get('/', (req, res) => res.send('🤖 Bot is Online!'));

app.post('/api/control', async (req, res) => {
    const { secret, type, channelId, message, userId } = req.body;

    // เช็ครหัสผ่านก่อน
    if (secret !== API_SECRET) {
        return res.status(403).json({ error: "❌ รหัสผ่านไม่ถูกต้อง!" });
    }

    try {
        // กรณีสั่งส่งข้อความ
        if (type === 'send_message') {
            const channel = await client.channels.fetch(channelId);
            if (!channel) return res.status(404).json({ error: "หาห้องไม่เจอ" });
            
            await channel.send(message);
            return res.json({ success: true, msg: "ส่งข้อความสำเร็จ" });
        }
        
        // กรณีสั่งให้ DM หา user (ตัวอย่างเพิ่มเติม)
        if (type === 'dm_user') {
            const user = await client.users.fetch(userId);
            if (!user) return res.status(404).json({ error: "หาคนไม่เจอ" });
            
            await user.send(message);
            return res.json({ success: true, msg: "DM สำเร็จ" });
        }

        res.status(400).json({ error: "ไม่รู้จักคำสั่งนี้" });

    } catch (error) {
        console.error("API Error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/stats', (req, res) => {
    // เช็ค Secret Key เพื่อความปลอดภัย
    const secret = req.headers['authorization'] || req.query.secret;
    if (secret !== API_SECRET) {
        return res.status(403).json({ error: "Access Denied" });
    }

    // คำนวณ Uptime
    const uptimeSeconds = process.uptime();
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);

    // ส่งข้อมูลกลับไป
    res.json({
        servers: client.guilds.cache.size,
        users: client.users.cache.size, // หรือจะนับรวมทั้งหมด
        ping: client.ws.ping,
        uptime: `${hours} ชม. ${minutes} นาที`,
        status: client.user ? 'Online' : 'Offline'
    });
});

app.listen(port, '0.0.0.0', () => {
    console.log(`✅ Dummy Server running on port ${port}`);
});

// เชื่อมต่อ MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB!'))
    .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// ================= 2. ตั้งค่า Discord Bot =================
const TOKEN = process.env.BOT_TOKEN;
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers,    
        GatewayIntentBits.GuildModeration   
    ]
});

// --- Config Channels & IDs ---
const ADD_ROLE_CHANNEL_ID = '1450456011352572087'; 
const REMOVE_ROLE_CHANNEL_ID = '1450456083121442846'; 
const ROLE_LOG_CHANNEL_ID = '1450461123924201492';
const UPDATE_ROLE_LOG_CHANNEL_ID = '1450464244717064283';
const ROLE_DELETE_LOG_ID = '1450465521538699354';
const BAN_LOG_CHANNEL_ID = '1450466985447002286';
const UNBAN_LOG_CHANNEL_ID = '1450468042633908224';

const TARGET_CATEGORY_ID = '1428682337952206848';
const STAFF_ROLE_ID = '1443797915230539928';
const NOTIFY_ITEM_USERS = ['1390444294988369971'];
const NOTIFY_TRADE_USERS = ['1056886143754444840'];
const TARGET_CHANNEL_ID = '1434589377173917697'; 
const SUPPORT_LOG_CHANNEL_ID = '1456315702528053451';
const BYPASS_ROLES = [
    '1393129924671307796', 
    '1443797915230539928',
    '1393122803871387738'  
];
const IGNORE_CHANNELS = ['1449796031800672318'];
const BAD_WORDS = ['เอ๋อ', 'ปัญญาอ่อน', 'ควย', 'สัส', 'เหี้ย', 'เย็ด', 'หี'];
const AUTOMOD_LOG_CHANNEL = '1456317915312947344';

// --- โหลดคำสั่ง Slash Commands ---
client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
if (fs.existsSync(foldersPath)) {
    const commandFolders = fs.readdirSync(foldersPath);
    for (const folder of commandFolders) {
        const commandsPath = path.join(foldersPath, folder);
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath);
            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
            }
        }
    }
}

const AutoKick = require('./models/AutoKick');

client.on('voiceStateUpdate', async (oldState, newState) => {
    if (!newState.channelId) return;

    // เช็คใน Database ว่า ID นี้ต้องโดนเตะไหม
    const isTarget = await AutoKick.findOne({ userId: newState.id, guildId: newState.guild.id });

    if (isTarget) {
        try {
            await newState.disconnect('ระบบตัดการเชื่อมต่ออัตโนมัติ');
            console.log(`[AutoKick] เตะ ${newState.id} ออกจากห้องเสียง`);
        } catch (error) {
            console.error('ไม่สามารถเตะได้:', error);
        }
    }
});

// --- Helper Functions ---
function translatePerms(bitfield) {
    const p = new PermissionsBitField(bitfield);
    const important = [];
    if (p.has(PermissionsBitField.Flags.Administrator)) important.push('⭐ผู้ดูแลระบบ');
    if (p.has(PermissionsBitField.Flags.ManageGuild)) important.push('จัดการเซิร์ฟเวอร์');
    if (p.has(PermissionsBitField.Flags.ManageRoles)) important.push('จัดการยศ');
    if (p.has(PermissionsBitField.Flags.ManageChannels)) important.push('จัดการห้อง');
    if (p.has(PermissionsBitField.Flags.BanMembers)) important.push('แบนสมาชิก');
    if (p.has(PermissionsBitField.Flags.MentionEveryone)) important.push('แท็กทุกคน');
    return important.length > 0 ? important.join(', ') : 'สิทธิ์ทั่วไป';
}

let currentCount = 0;

// ================= 3. Bot Events =================

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    if (message.channel.id !== TARGET_CHANNEL_ID) return;

    if (message.content.trim() === '+1') {
        currentCount++;
        try {
            await message.channel.setName(`เครดิต-${currentCount}`);
            await message.react('💗');
        } catch (error) { console.log(`Rate Limit: ${currentCount}`); }
    }
    
    if (message.content.trim() === '!reset') {
        currentCount = 0;
        await message.channel.setName(`count-${currentCount}`);
        await message.reply('รีเซ็ตเลขเป็น 0 แล้วครับ');
    }
});

client.on('messageCreate', async message => {
    // 1. เงื่อนไขข้าม: ไม่ตรวจสอบบอท / ห้องที่ยกเว้น / แชทส่วนตัว (DM)
    if (message.author.bot) return;
    if (!message.guild) return; 
    if (IGNORE_CHANNELS.includes(message.channel.id)) return;

    // 2. เงื่อนไขข้าม: เช็คว่าคนพิมพ์มียศกันลบไหม? (Staff/Admin)
    const isStaff = message.member.roles.cache.some(role => BYPASS_ROLES.includes(role.id));
    if (isStaff) return;

    const content = message.content.toLowerCase().replace(/\s+/g, ''); // ลบช่องว่างออกเพื่อให้เช็คแม่นขึ้น (เช่น "ค ว ย")

    // --- 🚨 ฟังก์ชันที่ 1: กรองคำหยาบ ---
    const foundBadWord = BAD_WORDS.find(word => content.includes(word));
    
    if (foundBadWord) {
        try {
            await message.delete(); // 🗑️ ลบข้อความทันที
            
            // ⚠️ ส่งข้อความเตือนในห้อง (ลบออกเองใน 5 วิ)
            const warningMsg = await message.channel.send({ 
                content: `⚠️ <@${message.author.id}> **กรุณาใช้คำสุภาพครับ!** (ห้ามพิมพ์คำหยาบ)` 
            });
            setTimeout(() => warningMsg.delete().catch(() => {}), 5000);

            // 📝 ส่งหลักฐานเข้าห้อง Log แอดมิน
            const logChannel = client.channels.cache.get(AUTOMOD_LOG_CHANNEL);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('🛡️ AutoMod: ตรวจพบคำหยาบ')
                    .setColor('#e74c3c') // สีแดง
                    .addFields(
                        { name: '👤 ผู้กระทำผิด', value: `<@${message.author.id}> (${message.author.tag})`, inline: true },
                        { name: '📺 ห้อง', value: `<#${message.channel.id}>`, inline: true },
                        { name: '💬 ข้อความที่ลบ', value: `||${message.content}||` } // ใส่ Spoiler ปิดไว้
                    )
                    .setTimestamp();
                logChannel.send({ embeds: [logEmbed] });
            }
            return; // จบการทำงาน (เพื่อไม่ให้ทำงานซ้ำซ้อนกับกันลิงก์)
        } catch (error) {
            console.error('AutoMod Delete Error:', error);
        }
    }

    // --- 🚫 ฟังก์ชันที่ 2: กันลิงก์ Discord (Invite) ---
    // เช็คว่ามีคำว่า discord.gg หรือ discord.com/invite ไหม
    if (content.includes('discord.gg/') || content.includes('discord.com/invite/')) {
        try {
            await message.delete(); // 🗑️ ลบข้อความ

            // ⚠️ เตือน
            const warningMsg = await message.channel.send({ 
                content: `🚫 <@${message.author.id}> **ไม่อนุญาตให้ฝากร้านหรือแปะลิงก์เซิร์ฟเวอร์อื่นครับ!**` 
            });
            setTimeout(() => warningMsg.delete().catch(() => {}), 5000);

            // 📝 ส่งหลักฐานเข้าห้อง Log
            const logChannel = client.channels.cache.get(AUTOMOD_LOG_CHANNEL);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('🛡️ AutoMod: ตรวจพบลิงก์เชิญ')
                    .setColor('#f1c40f') // สีเหลือง
                    .addFields(
                        { name: '👤 ผู้กระทำผิด', value: `<@${message.author.id}> (${message.author.tag})`, inline: true },
                        { name: '📺 ห้อง', value: `<#${message.channel.id}>`, inline: true },
                        { name: '🔗 ลิงก์ที่ลบ', value: `\`${message.content}\`` }
                    )
                    .setTimestamp();
                logChannel.send({ embeds: [logEmbed] });
            }
        } catch (error) {}
    }
});

/* ================= INTERACTION HANDLER ================= */
client.on('interactionCreate', async interaction => {
    const { guild, user, customId } = interaction;

    // --- 1. Slash Commands ---
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.deferReply();
            }
            await command.execute(interaction);
        } catch (error) {
            // 🛑 ดักจับ Error 10062 (Unknown interaction) ที่เกิดจากบอทตื่นสาย
            if (error.code === 10062 || error.code === 40060) {
                console.log(`⚠️ Time out: บอทตอบสนองไม่ทัน (${interaction.commandName}) - กรุณากดใหม่`);
                return; // จบการทำงาน ไม่ต้องพ่น Error ยาวๆ
            }

            console.error("Command Error:", error);
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ content: '❌ เกิดข้อผิดพลาดในการรันคำสั่งนี้!' }).catch(() => {});
            } else {
                await interaction.reply({ content: '❌ เกิดข้อผิดพลาด!', ephemeral: true }).catch(() => {});
            }
        }
        return;
    }

    if (interaction.isButton() && interaction.customId === 'open_contact_modal') {
        const modal = new ModalBuilder()
            .setCustomId('contact_form_submit')
            .setTitle('📝 แบบฟอร์มติดต่อทีมงาน');

        // ช่องกรอกหัวข้อ
        const subjectInput = new TextInputBuilder()
            .setCustomId('contact_subject')
            .setLabel("หัวข้อเรื่อง")
            .setPlaceholder("เช่น กดTicketไม่ได้, พบเจอบัค")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        // ช่องกรอกรายละเอียด
        const detailInput = new TextInputBuilder()
            .setCustomId('contact_detail')
            .setLabel("รายละเอียด")
            .setPlaceholder("อธิบายปัญหาของคุณให้ละเอียด...")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const firstRow = new ActionRowBuilder().addComponents(subjectInput);
        const secondRow = new ActionRowBuilder().addComponents(detailInput);

        modal.addComponents(firstRow, secondRow);
        await interaction.showModal(modal);
    }

    // 🟢 2. เช็คเมื่อ User กดส่งฟอร์ม (contact_form_submit)
    if (interaction.isModalSubmit() && interaction.customId === 'contact_form_submit') {
        // ดึงข้อมูลที่เขากรอกมา
        const subject = interaction.fields.getTextInputValue('contact_subject');
        const detail = interaction.fields.getTextInputValue('contact_detail');

        // ส่งข้อความไปห้อง Log แอดมิน
        const logChannel = client.channels.cache.get(SUPPORT_LOG_CHANNEL_ID);
        if (logChannel) {
            const embed = new EmbedBuilder()
                .setTitle('📩 มีการติดต่อใหม่ (Support Ticket)')
                .setColor('#e67e22') // สีส้ม
                .addFields(
                    { name: '👤 ผู้ส่ง', value: `<@${interaction.user.id}> (${interaction.user.tag})`, inline: true },
                    { name: '🆔 User ID', value: interaction.user.id, inline: true },
                    { name: '📝 หัวข้อ', value: subject, inline: false },
                    { name: '📄 รายละเอียด', value: detail, inline: false },
                    { name: '⏰ เวลา', value: time(new Date(), 'F'), inline: false }
                )
                .setThumbnail(interaction.user.displayAvatarURL());

            // แท็กแอดมิน หรือ Role Staff ให้รู้ตัว
            logChannel.send({ 
                content: `🔔 **Admin Alert:** มีข้อความใหม่จาก <@${interaction.user.id}>`, 
                embeds: [embed] 
            });
        }

        // ตอบกลับ User ว่าได้รับเรื่องแล้ว
        await interaction.reply({ 
            content: '✅ **ส่งข้อมูลเรียบร้อย!** ทีมงานจะรีบตรวจสอบและติดต่อกลับโดยเร็วที่สุดครับ', 
            ephemeral: true // เห็นแค่คนส่ง
        });
    }

    // --- 2. Button: Close Room ---
    if (interaction.isButton() && interaction.customId === 'close_room') {
        const ALLOWED_USER_IDS = ['1390444294988369971', '774417760281165835', '1056886143754444840'];
        const isStaff = interaction.member.roles.cache.has(STAFF_ROLE_ID);
        const isAllowedUser = ALLOWED_USER_IDS.includes(interaction.user.id);

        if (!isStaff && !isAllowedUser) {
            return interaction.reply({ content: '❌ เฉพาะทีมงานเท่านั้นที่ปิดห้องได้', flags: [MessageFlags.Ephemeral] });
        }

        try {
            await interaction.reply({ content: '🔒 กำลังลบห้องนี้ภายใน 3 วินาที...' });
            setTimeout(async () => { 
                await interaction.channel.delete().catch(() => {}); 
            }, 3000);
        } catch (error) { console.error('ลบห้องผิดพลาด:', error); }
        return;
    }

    /* ================= SELECT PRODUCT / FARM (Main Logic) ================= */
    if (interaction.isStringSelectMenu()) {
        const value = interaction.values[0];
        
        // --- 3.1 แสดงรายละเอียดสินค้า ---
        let selected = null;
        if (interaction.customId.startsWith('select_product')) selected = products[value];
        if (interaction.customId.startsWith('select_farm')) selected = farmPackages[value];

        if (selected) {
            const embeds = [];
            const imagesToShow = selected.images ? selected.images.slice(0, 3) : [];

            if (imagesToShow.length > 0) {
                imagesToShow.forEach((imgUrl, index) => {
                    const embed = new EmbedBuilder().setColor('#f1c40f').setImage(imgUrl);
                    if (index === 0) {
                        embed.setTitle(`${selected.emoji || '✨'} ${selected.name}`)
                             .setDescription(
                                `💰 **ราคา:** ${selected.price}\n` +
                                `📝 **รายละเอียด:** ${selected.description}\n\n` +
                                `*กรุณารอทีมงานมาตอบกลับสักครู่ครับ*`
                             );
                    }
                    embeds.push(embed);
                });
            } else {
                const noImageEmbed = new EmbedBuilder()
                    .setTitle(`${selected.emoji || '✨'} ${selected.name}`)
                    .setColor('#f1c40f')
                    .setDescription(
                        `💰 **ราคา:** ${selected.price}\n` +
                        `📝 **รายละเอียด:** ${selected.description}\n\n` +
                        `*กรุณารอทีมงานมาตอบกลับสักครู่ครับ*`
                    );
                embeds.push(noImageEmbed);
            }
            // เพิ่ม try-catch สำหรับการตอบกลับเมนู
            try {
                await interaction.reply({ embeds: embeds, ephemeral: true });
            } catch (err) {
                if (err.code !== 10062) console.error(err);
            }
            return;
        }
        
        // --- 3.2 สร้างห้อง (Room Setup) ---
        if (interaction.customId === 'room_setup') {
            try {
                await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

                const selectedValue = interaction.values[0];
                let channelName = '';
                let welcomeEmbed = new EmbedBuilder().setColor('#2ecc71').setTimestamp();
                let components = [];
                let typeName = ""; 
                const overwrites = [
                    { id: interaction.guild.id, type: OverwriteType.Role, deny: [PermissionFlagsBits.ViewChannel] },
                    { id: interaction.user.id, type: OverwriteType.Member, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] }
                ];
                
                if (selectedValue === 'create_item') {
                    typeName = "🛒 ซื้อของ";
                    channelName = `🧺-ซื้อของ-${user.username}`;
                    welcomeEmbed.setTitle('🛒 ยินดีต้อนรับสู่ร้านค้า พี่ TOJI').setDescription('เลือกสินค้าที่สนใจเพื่อดูราคาและรูปภาพครับ').setImage('https://cdn.discordapp.com/attachments/1133947298628517970/1452087430713966793/Toji.png');
                    
                    const allKeys = Object.keys(products);
                    const menu1 = new StringSelectMenuBuilder().setCustomId('select_product_1').setPlaceholder('--- เลือกสินค้า (หน้า 1) ---')
                        .addOptions(allKeys.slice(0, 25).map(key => ({ label: products[key].name, value: key, description: `ราคา: ${products[key].price}`, emoji: products[key].emoji })));
                    components.push(new ActionRowBuilder().addComponents(menu1));

                    if (allKeys.length > 25) {
                        const menu2 = new StringSelectMenuBuilder().setCustomId('select_product_2').setPlaceholder('--- เลือกสินค้า (หน้า 2) ---')
                            .addOptions(allKeys.slice(25).map(key => ({ label: products[key].name, value: key, description: `ราคา: ${products[key].price}`, emoji: products[key].emoji })));
                        components.push(new ActionRowBuilder().addComponents(menu2));
                    }
                    overwrites.push({ id: STAFF_ROLE_ID, type: 0, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });
                    NOTIFY_ITEM_USERS.forEach(id => overwrites.push({ id: id, type: 1, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }));
                }
                else if (selectedValue === 'create_farm') {
                    typeName = "⚔️ จ้างฟาร์ม";
                    channelName = `🎮-จ้างฟาม-${user.username}`;
                    welcomeEmbed.setTitle('⚔️ บริการจ้างฟาร์ม').setDescription('เลือกประเภทที่จะจ้างฟาร์มด้านล่างครับ').setImage('https://cdn.discordapp.com/attachments/1133947298628517970/1451492360361082910/image.png');
                    
                    const allFarmKeys = Object.keys(farmPackages);
                    const menu1 = new StringSelectMenuBuilder().setCustomId('select_farm_1').setPlaceholder('--- เลือกประเภทจ้างฟาร์ม (หน้า 1) ---')
                        .addOptions(allFarmKeys.slice(0, 25).map(key => ({ label: farmPackages[key].name, value: key, description: `ราคา: ${farmPackages[key].price}`, emoji: farmPackages[key].emoji })));
                    components.push(new ActionRowBuilder().addComponents(menu1));
                    
                    overwrites.push({ id: STAFF_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });
                    NOTIFY_ITEM_USERS.forEach(id => overwrites.push({ id: id, type: 0, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }));
                }
                else if (selectedValue === 'create_trade') {
                    typeName = "🤝 ติดต่อพ่อค้า";
                    channelName = `🤝-ติดต่อ-${user.username}`;
                    welcomeEmbed.setTitle('🤝 ติดต่อพ่อค้า').setDescription('สวัสดีครับ พิมพ์รายละเอียดที่ต้องการติดต่อทิ้งไว้ได้เลยครับ');
                    NOTIFY_TRADE_USERS.forEach(id => { if (id) overwrites.push({ id: id, type: 1, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }); });
                }

                components.push(new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('close_room').setLabel('ปิดห้อง').setStyle(ButtonStyle.Danger)));

                const channel = await guild.channels.create({ name: channelName, type: ChannelType.GuildText, parent: TARGET_CATEGORY_ID, permissionOverwrites: overwrites });
                await channel.send({ content: `ยินดีต้อนรับครับ ${user}`, embeds: [welcomeEmbed], components: components });
                await interaction.editReply({ content: `✅ สร้างห้องเรียบร้อยแล้ว: ${channel}` });
                await interaction.message.edit({ components: interaction.message.components }).catch(() => {}); 

                // --- แจ้งเตือน DM ---
                const notifyMsg = `🔔 **มีการสร้างห้องใหม่!**\n👤 **ลูกค้า:** ${user.tag}\n📂 **ประเภท:** ${typeName}\n🔗 **ห้อง:** <#${channel.id}>`;
                if (selectedValue === 'create_item') NOTIFY_ITEM_USERS.forEach(async id => (await guild.members.fetch(id).catch(() => null))?.send(notifyMsg).catch(() => {}));
                else if (selectedValue === 'create_trade') NOTIFY_TRADE_USERS.forEach(async id => (await guild.members.fetch(id).catch(() => null))?.send(notifyMsg).catch(() => {}));
                else if (selectedValue === 'create_farm') guild.roles.cache.get(STAFF_ROLE_ID)?.members?.forEach(m => !m.user.bot && m.send(notifyMsg).catch(() => {}));

            } catch (error) {
                 if (error.code === 10062) {
                    console.log(`⚠️ Room Setup Timeout: บอทตื่นไม่ทัน`);
                    return;
                }
                console.error("Room Error:", error);
                if (interaction.deferred) await interaction.editReply('เกิดข้อผิดพลาดในการสร้างห้อง');
            }
        }
    }
});

// ================= 4. Logging Events =================

client.on('roleCreate', async (role) => {

    // รอระบบอัปเดต Audit Log 1 วินาที

    await new Promise(resolve => setTimeout(resolve, 1000));



    const fetchedLogs = await role.guild.fetchAuditLogs({

        limit: 1,

        type: AuditLogEvent.RoleCreate,

    });



    const roleLog = fetchedLogs.entries.first();

    let executorTag = (roleLog && roleLog.target.id === role.id) ? `<@${roleLog.executor.id}>` : "ไม่ทราบชื่อ";



    const logChannel = client.channels.cache.get(ROLE_LOG_CHANNEL_ID);

    if (!logChannel) return;



    const embed = new EmbedBuilder()

        .setTitle('🆕 ตรวจพบการสร้างยศใหม่')

        .setColor(role.color || 0x3498db)

        .addFields(

            { name: '🌐 เซิร์ฟเวอร์', value: `**${role.guild.name}**`, inline: true },

            { name: '👤 คนสร้าง', value: executorTag, inline: true },

            { name: '🏷️ ชื่อยศ', value: `**${role.name}**`, inline: false },

            { name: '🎨 สี (Hex)', value: `\`${role.hexColor}\``, inline: true },

            { name: '🆔 ID ยศ', value: `\`${role.id}\``, inline: true },

            { name: '⏰ เวลาที่สร้าง', value: time(new Date(), 'F'), inline: false }

        )



    logChannel.send({ embeds: [embed] }).catch(console.error);

});



client.on('roleDelete', async (role) => {

    // รอระบบอัปเดต Audit Log 1 วินาที

    await new Promise(resolve => setTimeout(resolve, 1000));



    // ดึงข้อมูลจาก Audit Log ว่าใครเป็นคนกดลบ

    const fetchedLogs = await role.guild.fetchAuditLogs({

        limit: 1,

        type: AuditLogEvent.RoleDelete,

    });



    const deletionLog = fetchedLogs.entries.first();

    let executorTag = "ไม่ทราบคนลบ (อาจทำโดยระบบ)";

    

    // ตรวจสอบว่าข้อมูลใน Log ตรงกับยศที่เพิ่งลบไปหรือไม่

    if (deletionLog && deletionLog.targetId === role.id) {

        executorTag = `<@${deletionLog.executor.id}>`;

    }



    const logChannel = client.channels.cache.get(ROLE_DELETE_LOG_ID);

    if (!logChannel) return;



    // เตรียมเวลาปัจจุบัน

    const logTime = time(new Date(), 'F');



    const embed = new EmbedBuilder()

        .setTitle('🗑️ ตรวจพบการลบยศ')

        .setColor(0xFF0000) // สีแดง (เพราะเป็นการสูญเสียข้อมูล)

        .addFields(

            { name: '🌐 เซิร์ฟเวอร์', value: `**${role.guild.name}**`, inline: true },

            { name: '👤 คนลบ', value: executorTag, inline: true },

            { name: '🏷️ ยศที่ถูกลบ', value: `**${role.name}**`, inline: false },

            { name: '🎨 สีเดิมของยศ', value: `\`${role.hexColor}\``, inline: true },

            { name: '🆔 ID ยศเดิม', value: `\`${role.id}\``, inline: true },

            { name: '⏰ เวลาที่ถูกลบ', value: logTime, inline: false }

        )

        .setTimestamp()



    logChannel.send({ 

        content: `⚠️ ยศ **${role.name}** ถูกลบออกจากเซิร์ฟเวอร์ **${role.guild.name}**`, 

        embeds: [embed] 

    }).catch(console.error);

});



client.on('guildBanRemove', async (ban) => {

    const { guild, user } = ban;



    // รอ Audit Log อัปเดต 1.5 วินาที

    await new Promise(resolve => setTimeout(resolve, 1500));



    // ดึง Audit Log ล่าสุดที่เป็นการปลดแบน (MEMBER_BAN_REMOVE)

    const fetchedLogs = await guild.fetchAuditLogs({

        limit: 1,

        type: AuditLogEvent.MemberBanRemove,

    });



    const unbanLog = fetchedLogs.entries.first();

    let executor = "ไม่ทราบคนทำ";



    // ตรวจสอบว่าข้อมูลใน Log ตรงกับคนที่ถูกปลดแบนหรือไม่

    if (unbanLog && unbanLog.target.id === user.id) {

        executor = `<@${unbanLog.executor.id}>`;

    }



    const logChannel = client.channels.cache.get(UNBAN_LOG_CHANNEL_ID);

    if (!logChannel) return;



    const embed = new EmbedBuilder()

        .setTitle('🔓 ตรวจพบการปลดแบนสมาชิก')

        .setColor(0x00FF00) // สีเขียว

        .addFields(

            { name: '🌐 เซิร์ฟเวอร์', value: `**${guild.name}**`, inline: true },

            { name: '👤 คนทำ', value: executor, inline: true },

            { name: '🎯 คนที่ถูกปลดแบน', value: `**${user.tag}**\n(ID: ${user.id})`, inline: false },

            { name: '⏰ เวลาที่โดนปลด', value: time(new Date(), 'F') }

        )

        .setThumbnail(user.displayAvatarURL({ dynamic: true }))

        .setTimestamp()



    logChannel.send({ 

        content: `✅ **${user.tag}** ได้รับการปลดแบนโดย ${executor}`, 

        embeds: [embed] 

    }).catch(console.error);

});



client.on('guildBanAdd', async (ban) => {

    const { guild, user } = ban;



    // รอ Audit Log อัปเดต (แนะนำ 1-2 วินาทีเพื่อให้ข้อมูลใน Log พร้อม)

    await new Promise(resolve => setTimeout(resolve, 1500));



    // ดึง Audit Log ล่าสุดที่เป็นการแบน (MEMBER_BAN_ADD)

    const fetchedLogs = await guild.fetchAuditLogs({

        limit: 1,

        type: AuditLogEvent.MemberBanAdd,

    });



    const banLog = fetchedLogs.entries.first();

    let executor = "ไม่ทราบคนทำ";

    let reason = ban.reason || "ไม่ระบุเหตุผล";



    // ตรวจสอบว่าข้อมูลใน Log ตรงกับคนที่ถูกแบนหรือไม่

    if (banLog && banLog.target.id === user.id) {

        executor = `<@${banLog.executor.id}>`;

        // ถ้าแอดมินใส่เหตุผลตอนแบน ระบบจะดึงจาก Audit Log ได้แม่นยำกว่า

        if (banLog.reason) reason = banLog.reason;

    }



    const logChannel = client.channels.cache.get(BAN_LOG_CHANNEL_ID);

    if (!logChannel) return;



    const embed = new EmbedBuilder()

        .setTitle('🔨 ตรวจพบการแบนสมาชิก')

        .setColor(0xFF0000) // สีแดง

        .addFields(

            { name: '🌐 เซิร์ฟเวอร์', value: `**${guild.name}**`, inline: true },

            { name: '👤 คนทำ', value: executor, inline: true },

            { name: '🎯 คนที่ถูกแบน', value: `**${user.tag}**\n(ID: ${user.id})`, inline: false },

            { name: '📄 เหตุผล', value: `\`\`\`${reason}\`\`\`` },

            { name: '⏰ เวลาที่เเบน', value: time(new Date(), 'F') }

        )

        .setThumbnail(user.displayAvatarURL({ dynamic: true }))

        .setTimestamp()



    logChannel.send({ 

        content: `🚨 **${user.tag}** ถูกแบนออกจากเซิร์ฟเวอร์โดย ${executor}`, 

        embeds: [embed] 

    }).catch(console.error);

});



client.on('roleUpdate', async (oldRole, newRole) => {

    // รอ Audit Log อัปเดต

    await new Promise(resolve => setTimeout(resolve, 1000));



    const fetchedLogs = await newRole.guild.fetchAuditLogs({

        limit: 1,

        type: AuditLogEvent.RoleUpdate,

    });



    const roleLog = fetchedLogs.entries.first();

    let executor = (roleLog && roleLog.target.id === newRole.id) ? `<@${roleLog.executor.id}>` : "ไม่ทราบคนทำ";



    const logChannel = client.channels.cache.get(UPDATE_ROLE_LOG_CHANNEL_ID);

    if (!logChannel) return;



    const embed = new EmbedBuilder()

        .setTitle('🛠️ ตรวจพบการแก้ไขยศ')

        .setColor(0xFFAA00) // สีส้ม (เตือนการแก้ไข)

        .setTimestamp()

        .addFields(

            { name: '🌐 เซิร์ฟเวอร์', value: newRole.guild.name, inline: true },

            { name: '👤 ผู้แก้ไข', value: executor, inline: true },

            { name: '🏷️ ยศที่ถูกแก้', value: `**${newRole.name}**`, inline: false }

        );



    // เช็คการเปลี่ยนชื่อ

    if (oldRole.name !== newRole.name) {

        embed.addFields({ name: '📝 เปลี่ยนชื่อ', value: `\`${oldRole.name}\` ➡️ \`${newRole.name}\`` });

    }



    // เช็คการเปลี่ยนสี

    if (oldRole.hexColor !== newRole.hexColor) {

        embed.addFields({ name: '🎨 เปลี่ยนสี', value: `\`${oldRole.hexColor}\` ➡️ \`${newRole.hexColor}\`` });

    }



    // เช็คการเปลี่ยนสิทธิ์ (Permissions)

    if (oldRole.permissions.bitfield !== newRole.permissions.bitfield) {

        embed.addFields(

            { name: '🛠️ สิทธิ์เดิม', value: `\`\`\`${translatePerms(oldRole.permissions.bitfield)}\`\`\``, inline: true },

            { name: '✅ สิทธิ์ใหม่', value: `\`\`\`${translatePerms(newRole.permissions.bitfield)}\`\`\``, inline: true }

        );

        embed.setColor(0xFF0000); // เปลี่ยนเป็นสีแดงถ้ามีการแก้สิทธิ์

    }



    // ถ้าไม่มีข้อมูลที่สำคัญเปลี่ยนเลย (เช่น เปลี่ยนลำดับยศ) ไม่ต้องส่งก็ได้ หรือส่งเป็นแจ้งเตือนเล็กน้อย

    if (embed.data.fields.length > 3) {

        logChannel.send({ embeds: [embed] }).catch(console.error);

    }

});





client.on('guildMemberUpdate', async (oldMember, newMember) => {

    const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));

    const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));



    if (addedRoles.size === 0 && removedRoles.size === 0) return;



    // รอ Audit Log อัปเดต

    await new Promise(resolve => setTimeout(resolve, 1000));

    

    const fetchedLogs = await newMember.guild.fetchAuditLogs({

        limit: 1,

        type: AuditLogEvent.MemberRoleUpdate,

    });



    const roleLog = fetchedLogs.entries.first();

    let executorTag = "ไม่ทราบชื่อ";

    

    if (roleLog && roleLog.target.id === newMember.id) {

        // แท็กคนทำโดยใช้ <@ID>

        executorTag = `<@${roleLog.executor.id}>`;

    }



    // สร้าง Timestamp ของ Discord (แสดงเวลาแบบ Dynamic)

    const logTime = time(new Date(), 'F'); // แสดงวันและเวลาแบบเต็ม



    // --- กรณีมีการเพิ่มยศ ---

    if (addedRoles.size > 0) {

        const addChannel = client.channels.cache.get(ADD_ROLE_CHANNEL_ID);

        if (addChannel) {

            const addEmbed = new EmbedBuilder()

                .setTitle('➕ มีการเพิ่มยศ')

                .setColor(0x00FF00)

                .setDescription(`**รายละเอียด**`)

                .addFields(

                    { name: '🌐 เซิร์ฟเวอร์', value: `**${newMember.guild.name}**`, inline: true },

                    { name: '👤 คนทำ', value: executorTag, inline: true },

                    { name: '🎯 คนที่ถูกใส่ยศ', value: `<@${newMember.id}>`, inline: true },

                    { name: '🏷️ ยศที่เพิ่ม', value: addedRoles.map(r => r.name).join(', ') },

                    { name: '⏰ เวลาที่ใส่ยศ', value: logTime }

                )

            

            addChannel.send({ content: `🔔 มีการเพิ่มยศให้แก่ <@${newMember.id}>`, embeds: [addEmbed] }).catch(console.error);

        }

    }



    // --- กรณีมีการลบยศ ---

    if (removedRoles.size > 0) {

        const removeChannel = client.channels.cache.get(REMOVE_ROLE_CHANNEL_ID);

        if (removeChannel) {

            const removeEmbed = new EmbedBuilder()

                .setTitle('➖ มีการถอนยศ')

                .setColor(0xFF0000)

                .setDescription(`**รายละเอียด**`)

                .addFields(

                    { name: '🌐 เซิร์ฟเวอร์', value: `**${newMember.guild.name}**`, inline: true },

                    { name: '👤 คนทำ', value: executorTag, inline: true },

                    { name: '🎯 คนที่โดนลบยศ', value: `<@${newMember.id}>`, inline: true },

                    { name: '🏷️ ยศที่ถูกลบยศ', value: removedRoles.map(r => r.name).join(', ') },

                    { name: '⏰ เวลาที่ลบ', value: logTime }

                )

            

            removeChannel.send({ content: `⚠️ มีการถอนยศจาก <@${newMember.id}>`, embeds: [removeEmbed] }).catch(console.error);

        }

    }

});



// ================= 5. Start Bot =================
client.once('ready', async () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    try {
        const channel = await client.channels.fetch(TARGET_CHANNEL_ID);
        const parts = channel.name.split('-');
        const lastPart = parts[parts.length - 1];
        const extractedNumber = parseInt(lastPart);
        if (!isNaN(extractedNumber)) {
            currentCount = extractedNumber;
            console.log(`✅ ซิงค์เลขจากห้องสำเร็จ: ${currentCount}`);
        } else {
            console.log('⚠️ ไม่พบเลขในชื่อห้อง เริ่มนับ 0');
            currentCount = 0;
        }
    } catch (error) { console.error('❌ ดึงข้อมูลห้องผิดพลาด:', error); }

   const statusOptions = [
        {
            name: '𝑻𝒉𝒂𝒑𝒙𝒌𝒐𝒓𝒏𝑨𝑿',
            type: ActivityType.Streaming,
            url: 'https://www.twitch.tv/star_ssr'
        },
        {
            name: '𝑷.𝑷𝒆𝒅𝒛', 
            type: ActivityType.Streaming,
            url: 'https://www.twitch.tv/star_ssr'
        },
        {
            name: '𝑩𝒐𝒕 𝒃𝒚 𝑷𝒆𝒅',
            type: ActivityType.Streaming,
            url: 'https://www.twitch.tv/star_ssr'
        }
    ];

    let currentIndex = 0;

    const getUptimeString = () => {
        let totalSeconds = (client.uptime / 1000);
        let days = Math.floor(totalSeconds / 86400);
        let hours = Math.floor((totalSeconds % 86400) / 3600);
        let minutes = Math.floor((totalSeconds % 3600) / 60);

        if (days > 0) return `⏰ ออนมาแล้ว ${days} วัน ${hours} ชม.`;
        return `⏰ ออนมาแล้ว ${hours} ชม. ${minutes} นาที`;
    };

    // สร้างฟังก์ชันอัปเดตสถานะ
    const updateStatus = () => {
        const status = statusOptions[currentIndex];

        const timeString = getUptimeString();
        
        client.user.setActivity(status.name, { 
            type: status.type, 
            url: status.url,
            state: timeString
        });

        currentIndex = (currentIndex + 1) % statusOptions.length;
    };

    // เรียกครั้งแรกทันที (ไม่ต้องรอ 10 วิ)
    updateStatus();

    // ตั้งเวลาให้วนลูปทุก 10 วินาที
    setInterval(updateStatus, 10000);
});
client.login(TOKEN);