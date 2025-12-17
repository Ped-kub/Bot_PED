const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');

// --- สร้าง Embed Message (เหมือนเดิม) ---
const createMenuEmbed = () => {
  const embed = new EmbedBuilder()
    .setColor(0x00FF00)
    .setTitle('🎮 เมนูบอทฟรี - MENU FREE')
    .setDescription('กรุณาเลือกเมนูที่ต้องการจาก Dropdown ด้านล่าง:')
    .setImage('URL_TO_YOUR_CHARACTER_IMAGE') // **แทนที่ด้วย URL รูปภาพตัวละครของคุณ**
    .setTimestamp()
    .setFooter({ text: '© BOT Copyrights By. LEMON HUB' });

  return embed;
};

// --- สร้าง Dropdown Menu ---
const createMenuDropdown = () => {
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('main_menu_select')
    .setPlaceholder('เลือกรายการเมนูที่นี่...')
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel('copyemoji')
        .setDescription('ดึงข้อมูลและก๊อปอิโมจิจากเซิร์ฟเวอร์')
        .setValue('copy_emoji'),
      new StringSelectMenuOptionBuilder()
        .setLabel('จอยเซิฟออโต้')
        .setDescription('ให้บอทเข้าร่วมเซิร์ฟเวอร์อัตโนมัติ')
        .setValue('join_server'),
      new StringSelectMenuOptionBuilder()
        .setLabel('รับตราดิสคอร์ด')
        .setDescription('รับ Discord Badge พิเศษ (อาจเป็นมุขตลก)')
        .setValue('get_badge'),
      new StringSelectMenuOptionBuilder()
        .setLabel('Nuke เซิฟเวอร์')
        .setDescription('ล้างช่องและบทบาททั้งหมดในเซิร์ฟเวอร์ (อันตราย!)')
        .setValue('nuke_server'),
    );

  const actionRow = new ActionRowBuilder()
    .addComponents(selectMenu);

  return [actionRow]; // ส่งคืนเป็น Array ของ ActionRowBuilder
};

// --- จัดการ Interaction (การเลือก Dropdown) ---
const handleInteraction = async (interaction) => {
  // ตรวจสอบว่าเป็น String Select Menu interaction และ customId ถูกต้อง
  if (!interaction.isStringSelectMenu() || interaction.customId !== 'main_menu_select') {
    return;
  }

  // ค่าที่ผู้ใช้เลือกจะอยู่ใน interaction.values (เป็น Array)
  const selectedValue = interaction.values[0];

  switch (selectedValue) {
    case 'copy_emoji':
      await interaction.reply({ content: 'คุณเลือกเมนู ก๊อปอิโมจิ!', ephemeral: true });
      break;
    case 'join_server':
      await interaction.reply({ content: 'คุณเลือกเมนู จอยเซิฟออโต้!', ephemeral: true });
      break;
    case 'get_badge':
      await interaction.reply({ content: 'คุณเลือกเมนู รับตราดิสคอร์ด!', ephemeral: true });
      break;
    case 'nuke_server':
      await interaction.reply({ content: 'คำเตือน: คุณเลือกเมนู Nuke เซิฟเวอร์!', ephemeral: true });
      break;
    default:
      await interaction.reply({ content: 'ไม่พบคำสั่งสำหรับตัวเลือกนี้', ephemeral: true });
  }
};

// ส่งออกฟังก์ชันที่อัปเดตแล้ว (เปลี่ยนชื่อฟังก์ชันสร้างปุ่มเป็นสร้าง dropdown)
module.exports = { createMenuEmbed, createMenuDropdown, handleInteraction };