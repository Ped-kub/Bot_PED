require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 10000;

app.get('/', (req, res) => res.send('Bot is online!'));
app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
});

const {
    Client,
    GatewayIntentBits,
    ActivityType,
    PermissionFlagsBits,
    ChannelType,
    Collection,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const TOKEN = process.env.BOT_TOKEN;

const TARGET_CATEGORY_ID = '1428682337952206848';
const STAFF_ROLE_ID = '1443797915230539928';

// คนที่ให้แจ้ง
const NOTIFY_ITEM_USERS = ['1390444294988369971'];
const NOTIFY_TRADE_USERS = ['1056886143754444840'];

const { products, farmPackages } = require('./config.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

client.commands = new Collection();

client.on('interactionCreate', async interaction => {

    /* ---------- SELECT PRODUCT / FARM ---------- */
    if (interaction.isStringSelectMenu()) {
        let selected = null;

        if (interaction.customId === 'select_product') {
            selected = products[interaction.values[0]];
        }
        if (interaction.customId === 'select_farm') {
            selected = farmPackages[interaction.values[0]];
        }

        if (!selected) return;

        const embeds = [];
        const images = selected.images?.slice(0, 3) || [];

        images.forEach((img, index) => {
            const embed = new EmbedBuilder()
                .setColor('#f1c40f')
                .setImage(img);

            if (index === 0) {
                embed
                    .setTitle(`✨ ${selected.name}`)
                    .setDescription(
`💰 ราคา: ${selected.price}

${selected.description}

${selected.details ?? ''}`
                    );
            }

            embeds.push(embed);
        });

        return interaction.reply({ embeds, ephemeral: true });
    }

    /* ---------- CLOSE ROOM ---------- */
    if (interaction.isButton() && interaction.customId === 'close_room') {
        const isStaff = interaction.member.roles.cache.has(STAFF_ROLE_ID);
        if (!isStaff) {
            return interaction.reply({ content: '❌ เฉพาะทีมงานเท่านั้น', ephemeral: true });
        }

        await interaction.reply({ content: '🔒 ลบห้องใน 3 วินาที...' });
        setTimeout(() => interaction.channel.delete().catch(() => {}), 3000);
        return;
    }

    /* ---------- ROOM SETUP ---------- */
    if (!interaction.isStringSelectMenu() || interaction.customId !== 'room_setup') return;

    await interaction.deferReply({ ephemeral: true });

    const { guild, user } = interaction;
    const value = interaction.values[0];

    let channelName = '';
    let embed = new EmbedBuilder().setColor('#2ecc71');
    let rows = [];

    const overwrites = [
        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
        { id: STAFF_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
    ];

    if (value === 'create_item') {
        channelName = `🧺-ซื้อของ-${user.username}`;
        embed.setTitle('🛒 ร้านค้า').setDescription('เลือกสินค้าที่ต้องการ');

        rows.push(new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('select_product')
                .setPlaceholder('เลือกสินค้า')
                .addOptions(Object.keys(products).map(k => ({
                    label: products[k].name,
                    value: k,
                    description: `ราคา ${products[k].price}`,
                    emoji: products[k].emoji
                })))
        ));
    }

    if (value === 'create_farm') {
        channelName = `🎮-จ้างฟาร์ม-${user.username}`;
        embed.setTitle('⚔️ จ้างฟาร์ม');

        rows.push(new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('select_farm')
                .setPlaceholder('เลือกแพ็กเกจ')
                .addOptions(Object.keys(farmPackages).map(k => ({
                    label: farmPackages[k].name,
                    value: k,
                    description: `ราคา ${farmPackages[k].price}`,
                    emoji: farmPackages[k].emoji
                })))
        ));
    }

    if (value === 'create_trade') {
        channelName = `🙆‍♂️-ติดต่อพ่อค้า-${user.username}`;
        embed.setTitle('🤝 ติดต่อพ่อค้า');
    }

    const channel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: TARGET_CATEGORY_ID,
        permissionOverwrites: overwrites
    });

    rows.push(new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('close_room')
            .setLabel('ปิดห้อง')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🔒')
    ));

    await channel.send({
        content: `👋 ${user}`,
        embeds: [embed],
        components: rows
    });

    await interaction.editReply({ content: `✅ สร้างห้องแล้ว: ${channel}` });

    /* ---------- NOTIFY ---------- */
    const notifyMessage =
`🔔 มีการสร้างห้องใหม่
👤 ลูกค้า: ${user.tag}
📂 ประเภท: ${value}
🔗 ห้อง: <#${channel.id}>`;

    // ซื้อของ
    if (value === 'create_item') {
        for (const id of NOTIFY_ITEM_USERS) {
            const member = await guild.members.fetch(id).catch(() => null);
            member?.send(notifyMessage).catch(() => {});
        }
    }

    // ติดต่อพ่อค้า
    if (value === 'create_trade') {
        for (const id of NOTIFY_TRADE_USERS) {
            const member = await guild.members.fetch(id).catch(() => null);
            member?.send(notifyMessage).catch(() => {});
        }
    }

    // จ้างฟาร์ม → STAFF ทั้งหมด
    if (value === 'create_farm') {
        const staffRole = guild.roles.cache.get(STAFF_ROLE_ID);
        staffRole?.members.forEach(m => {
            if (!m.user.bot) {
                m.send(notifyMessage).catch(() => {});
            }
        });
    }
});

client.once('ready', () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    client.user.setActivity('ThapxkornAX', {
        type: ActivityType.Streaming,
        url: 'https://www.twitch.tv/star_ssr'
    });
});

client.login(TOKEN);