const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, REST, Routes } = require('discord.js');
const { DisTube } = require('distube');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

// הגדרת מנוע השמעת המוזיקה בחדר הקולי
const distube = new DisTube(client, {
    leaveOnEmpty: true,
    leaveOnFinish: false,
    emitNewSongOnly: true,
});

const PREFIX = '!'; 

client.once('ready', async () => {
    console.log(`🤖 הבוט מוכן ומחובר לוויס! בתור: ${client.user.tag}`);
    const commands = [{ name: 'setup', description: 'מציג את פאנל השליטה הציבורי של הבוט' }];
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    } catch (e) { console.error(e); }
});

function createMasterPanel() {
    const embed = new EmbedBuilder()
        .setColor('#2b2d31')
        .setTitle('🗃️ Master Control Panel')
        .setDescription('ברוך הבא לפאנל השליטה של בוט המוזיקה.\nפתח את התפריט למטה ובחר את סגנון השליטה המועדף עליך:');

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('select_panel_style')
        .setPlaceholder('⚡ Advanced (Quick-Actions)')
        .addOptions([
            { label: 'Simple (User-Friendly)', description: 'פאנל שליטה בסיסי ונוח למשתמש', value: 'style_simple', emoji: '🎵' },
            { label: 'Advanced (Quick-Actions)', description: 'פאנל פעולות מהירות לשליטה מלאה', value: 'style_advanced', emoji: '⚡' },
        ]);

    return { embeds: [embed], components: [new ActionRowBuilder().addComponents(selectMenu)] };
}

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;
    const command = message.content.slice(PREFIX.length).trim().split(/ +/).shift().toLowerCase();

    if (command === 'setup') {
        await message.delete().catch(() => {});
        await message.channel.send(createMasterPanel());
    }
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand() && interaction.commandName === 'setup') {
        return await interaction.reply(createMasterPanel());
    }

    if (interaction.isStringSelectMenu() && interaction.customId === 'select_panel_style') {
        const selectedValue = interaction.values;

        const modal = new ModalBuilder()
            .setCustomId(`confirm_modal_${selectedValue}`)
            .setTitle(selectedValue === 'style_simple' ? '🎵 טעינת פאנל פשוט' : '⚡ טעינת פאנל מתקדם');

        const confirmInput = new TextInputBuilder()
            .setCustomId('confirm_input')
            .setLabel('לחץ על "שלח" כדי לפתוח את הלוח הנסתר:')
            .setStyle(TextInputStyle.Short)
            .setValue('אישור')
            .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(confirmInput));
        return await interaction.showModal(modal);
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith('confirm_modal_')) {
        const style = interaction.customId.replace('confirm_modal_', '');

        if (style === 'style_simple') {
            const embedSimple = new EmbedBuilder()
                .setColor('#5865f2')
                .setTitle('🎵 User Friendly Control Panel')
                .setDescription('לחץ על הכפתור הירוק כדי להקליד שיר בצורה חסויה ולנגן!');

            const playBtn = new ButtonBuilder().setCustomId('btn_play').setLabel('נגן שיר 🎶').setStyle(ButtonStyle.Success);
            const pauseBtn = new ButtonBuilder().setCustomId('btn_pause').setLabel('▶️ / ⏸️ הפעל/השהה').setStyle(ButtonStyle.Primary);
            const skipBtn = new ButtonBuilder().setCustomId('btn_skip').setLabel('⏭️ דילוג').setStyle(ButtonStyle.Secondary);
            const stopBtn = new ButtonBuilder().setCustomId('btn_stop').setLabel('🛑 ניתוק').setStyle(ButtonStyle.Danger);

            const row = new ActionRowBuilder().addComponents(playBtn, pauseBtn, skipBtn, stopBtn);
            return await interaction.reply({ embeds: [embedSimple], components: [row], ephemeral: true });
        }

        if (style === 'style_advanced') {
            const embedAdvanced = new EmbedBuilder()
                .setColor('#23a55a')
                .setTitle('⚡ Advanced Quick-Actions Panel')
                .setDescription('פעולות שליטה מתקדמות ומהירות בנגן:');

            const playBtn2 = new ButtonBuilder().setCustomId('btn_adv_play').setLabel('חפש ונגן שיר 🎵').setStyle(ButtonStyle.Success);
            const pauseBtn2 = new ButtonBuilder().setCustomId('btn_adv_pause').setLabel('השהה ⏸️').setStyle(ButtonStyle.Secondary);
            const resumeBtn2 = new ButtonBuilder().setCustomId('btn_adv_resume').setLabel('המשך ▶️').setStyle(ButtonStyle.Success);
            const nextBtn2 = new ButtonBuilder().setCustomId('btn_adv_next').setLabel('הבא בתור ⏭️').setStyle(ButtonStyle.Primary);
            const clearLeaveBtn2 = new ButtonBuilder().setCustomId('btn_adv_clear_leave').setLabel('ניקוי תור וניתוק 🛑').setStyle(ButtonStyle.Danger);

            const row = new ActionRowBuilder().addComponents(playBtn2, pauseBtn2, resumeBtn2, nextBtn2, clearLeaveBtn2);
            return await interaction.reply({ embeds: [embedAdvanced], components: [row], ephemeral: true });
        }
    }

    if (interaction.isButton()) {
        const queue = distube.getQueue(interaction.guildId);

        if (interaction.customId === 'btn_play' || interaction.customId === 'btn_adv_play') {
            const modalSong = new ModalBuilder().setCustomId('music_play_modal').setTitle('🎵 הזרמת שיר בזמן אמת');
            const songInput = new TextInputBuilder()
                .setCustomId('song_name_input')
                .setLabel('הקש את שם השיר או קישור מיוטיוב:')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('לדוגמה: אושר כהן')
                .setRequired(true);

            modalSong.addComponents(new ActionRowBuilder().addComponents(songInput));
            return await interaction.showModal(modalSong);
        }

        // הפעלת לוגיקת כפתורי השמע בוויס האמיתי!
        await interaction.deferUpdate();

        if (interaction.customId === 'btn_pause' || interaction.customId === 'btn_adv_pause') {
            if (!queue) return;
            if (queue.paused) distube.resume(interaction.guildId);
            else distube.pause(interaction.guildId);
        }

        if (interaction.customId === 'btn_adv_resume') {
            if (queue && queue.paused) distube.resume(interaction.guildId);
        }

        if (interaction.customId === 'btn_skip' || interaction.customId === 'btn_adv_next') {
            if (queue) {
                try { await distube.skip(interaction.guildId); } catch (e) {}
            }
        }

        if (interaction.customId === 'btn_stop' || interaction.customId === 'btn_adv_clear_leave') {
            if (queue) distube.stop(interaction.guildId);
        }
    }

    // קבלת שם השיר מהחלונית, כניסה לוויס וניגון השיר בפועל!
    if (interaction.isModalSubmit() && interaction.customId === 'music_play_modal') {
        const songName = interaction.fields.getTextInputValue('song_name_input');
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            return await interaction.reply({ content: '❌ עליך להיכנס לחדר קולי קודם לכן כדי שהבוט ייכנס אליך!', ephemeral: true });
        }

        await interaction.reply({ content: `🔍 מחפש ונכנס לוויס לנגן את: **${songName}**...`, ephemeral: true });

        try {
            await distube.play(voiceChannel, songName, {
                textChannel: interaction.channel,
                member: interaction.member
            });
        } catch (error) {
            console.error(error);
        }
    }
});

// עדכונים ציבוריים בצ'אט הכללי כשהשיר מתחיל
distube.on('playSong', (queue, song) => {
    queue.textChannel.send(`🎶 מזרים עכשיו בחדר הקולי: **${song.name}** [${song.formattedDuration}]\nהופעל על ידי: ${song.user}`);
});

distube.on('addSong', (queue, song) => {
    queue.textChannel.send(`✅ התווסף לתור ההזרמה: **${song.name}**`);
});

client.login(process.env.TOKEN);
