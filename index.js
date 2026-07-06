const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, NoSubscriberBehavior } = require('@discordjs/voice');
const play = require('play-dl');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

const PREFIX = '!'; 
let connection = null;
let player = null;

client.once('ready', async () => {
    console.log(`🤖 בוט המוזיקה החופשי מוכן ויציב! מחובר בתור: ${client.user.tag}`);
    
    // תיקון קריטי: הפעלת מפתח הגישה החופשי של סאונדקלאוד כדי למנוע חסימות שמע
    try {
        await play.getFreeClientID();
        console.log("✅ מפתח הגישה של סאונדקלאוד הופעל בהצלחה!");
    } catch (e) {
        console.error("שגיאה בטעינת מפתח הגישה:", e);
    }
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
        if (interaction.customId === 'btn_play' || interaction.customId === 'btn_adv_play') {
            const modalSong = new ModalBuilder().setCustomId('music_play_modal').setTitle('🎵 הזרמת שיר בזמן אמת');
            const songInput = new TextInputBuilder()
                .setCustomId('song_name_input')
                .setLabel('הקש את שם השיר שאתה רוצה לנגן (בלי קישור):')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('לדוגמה: אושר כהן - תרקדי')
                .setRequired(true);

            modalSong.addComponents(new ActionRowBuilder().addComponents(songInput));
            return await interaction.showModal(modalSong);
        }

        await interaction.deferUpdate();

        if (interaction.customId === 'btn_pause' || interaction.customId === 'btn_adv_pause') {
            if (player) player.pause();
        }
        if (interaction.customId === 'btn_adv_resume') {
            if (player) player.unpause();
        }
        if (interaction.customId === 'btn_stop' || interaction.customId === 'btn_adv_clear_leave' || interaction.customId === 'btn_skip') {
            if (connection) {
                connection.destroy();
                connection = null;
                player = null;
            }
        }
    }

    if (interaction.isModalSubmit() && interaction.customId === 'music_play_modal') {
        const songName = interaction.fields.getTextInputValue('song_name_input');
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            return await interaction.reply({ content: '❌ עליך להיכנס לחדר קולי קודם לכן!', ephemeral: true });
        }

        await interaction.reply({ content: `🔍 מחפש ומזרים עבורך את השיר: **${songName}**...`, ephemeral: true });

        try {
            // חיפוש חופשי ומאובטח דרך מנוע SoundCloud (עוקף לחלוטין את החסימות של יוטיוב בענן)
            const results = await play.search(songName, { limit: 1, source: { soundcloud: 'tracks' } });
            
            if (!results || results.length === 0) {
                return await interaction.followUp({ content: '❌ לא מצאתי שיר בשם הזה במערכת.', ephemeral: true });
            }

            const track = results[0]; // לוקח את השיר הראשון מתוך המערך

            // חיבור לוויס
            connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            });

            player = createAudioPlayer({
                behaviors: { noSubscriber: NoSubscriberBehavior.Play }
            });

            // הזרמה ישירה עם מפתח הגישה המאושר
            const stream = await play.stream(track.url);
            const resource = createAudioResource(stream.stream, { inputType: stream.type }); 
            
            player.play(resource);
            connection.subscribe(player);

            interaction.channel.send(`🎶 מנגן עכשיו בחדר הקולי: **${track.name}**\nהופעל בהצלחה מתוך הפאנל הנסתר!`);

        } catch (error) {
            console.error(error);
            await interaction.followUp({ content: '❌ תקלה בהזרמת השמע, אנא נסה שוב.', ephemeral: true });
        }
    }
});

client.login(process.env.TOKEN);
