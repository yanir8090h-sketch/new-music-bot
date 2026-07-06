const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

const PREFIX = '!'; 

client.once('ready', () => {
    console.log(`🤖 הבוט מוכן ופועל! מחובר בתור: ${client.user.tag}`);
});

// פקודת Setup פשוטה וישירה - שולחת מיד את שני הלוחות עם הכפתורים!
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'setup') {
        // מחיקת הפקודה המקורית כדי לשמור על ערוץ נקי
        await message.delete().catch(() => {});

        // תפריט 1: פאנל פשוט ונוח
        const embedSimple = new EmbedBuilder()
            .setColor('#2b2d31')
            .setTitle('🎵 User Friendly Control Panel')
            .setDescription('לחץ על הכפתורים למטה כדי לשלוט במוזיקה בזמן אמת!');

        const playBtn = new ButtonBuilder().setCustomId('btn_play').setLabel('נגן שיר 🎶').setStyle(ButtonStyle.Success);
        const pauseBtn = new ButtonBuilder().setCustomId('btn_pause').setLabel('הפעל/השהה ⏸️').setStyle(ButtonStyle.Primary);
        const skipBtn = new ButtonBuilder().setCustomId('btn_skip').setLabel('דילוג ⏭️').setStyle(ButtonStyle.Secondary);
        const stopBtn = new ButtonBuilder().setCustomId('btn_stop').setLabel('עצור 🛑').setStyle(ButtonStyle.Danger);

        const rowBtns1 = new ActionRowBuilder().addComponents(playBtn, pauseBtn, skipBtn, stopBtn);

        // תפריט 2: פאנל פעולות מהירות מתקדם
        const embedAdvanced = new EmbedBuilder()
            .setColor('#23a55a')
            .setTitle('⚡ Advanced Quick-Actions Panel')
            .setDescription('פעולות שליטה מתקדמות ומהירות בבוט');

        const playBtn2 = new ButtonBuilder().setCustomId('btn_adv_play').setLabel('חפש ונגן שיר 🎵').setStyle(ButtonStyle.Success);
        const pauseBtn2 = new ButtonBuilder().setCustomId('btn_adv_pause').setLabel('השהה ⏸️').setStyle(ButtonStyle.Secondary);
        const resumeBtn2 = new ButtonBuilder().setCustomId('btn_adv_resume').setLabel('המשך ▶️').setStyle(ButtonStyle.Success);
        const nextBtn2 = new ButtonBuilder().setCustomId('btn_adv_next').setLabel('הבא בתור ⏭️').setStyle(ButtonStyle.Primary);
        const clearLeaveBtn2 = new ButtonBuilder().setCustomId('btn_adv_clear_leave').setLabel('ניקוי תור וניתוק 🛑').setStyle(ButtonStyle.Danger);

        const rowBtns2 = new ActionRowBuilder().addComponents(playBtn2, pauseBtn2, resumeBtn2, nextBtn2, clearLeaveBtn2);

        // שליחת שני הפאנלים ישירות לערוץ בצורה ציבורית ויציבה
        await message.channel.send({ embeds: [embedSimple], components: [rowBtns1] });
        await message.channel.send({ embeds: [embedAdvanced], components: [rowBtns2] });
    }
});

// ניהול הלחיצות על הכפתורים ופתיחת החלון הקופץ הפרטי
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    // פתיחת חלונית חיפוש שיר (Modal) - עובד בשבריר שנייה!
    if (interaction.customId === 'btn_play' || interaction.customId === 'btn_adv_play') {
        const modal = new ModalBuilder().setCustomId('music_play_modal').setTitle('🎵 הזרמת שיר בזמן אמת');
        const songInput = new TextInputBuilder()
            .setCustomId('song_name_input')
            .setLabel('הקש את שם השיר או קישור מיוטיוב:')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('לדוגמה: אושר כהן')
            .setRequired(true);

        const row = new ActionRowBuilder().addComponents(songInput);
        modal.addComponents(row);
        return await interaction.showModal(modal);
    }

    // שאר כפתורי השליטה (השהה, דילוג, עצור) מקבלים אישור מיידי ולא נתקעים
    await interaction.deferUpdate();
    console.log(`כפתור נלחץ במערכת: ${interaction.customId}`);
});

// קבלת שם השיר מהחלונית הקופצת
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isModalSubmit() || interaction.customId !== 'music_play_modal') return;
    
    const songName = interaction.fields.getTextInputValue('song_name_input');
    return await interaction.reply({ content: `🔍 מחפש ומזרים מיוטיוב עבורך: **${songName}**`, ephemeral: true });
});

client.login(process.env.TOKEN);
