import discord
from discord.ext import commands
import yt_dlp
import asyncio
import os

intents = discord.Intents.default()
intents.message_content = True
intents.voice_states = True

bot = commands.Bot(command_prefix="m!", intents=intents)

ytdl = yt_dlp.YoutubeDL({
    "format": "bestaudio/best",
    "quiet": True
})

ffmpeg_options = {
    "options": "-vn"
}


def search_song(query):
    info = ytdl.extract_info(
        f"ytsearch:{query}",
        download=False
    )
    return info["entries"][0]


class SearchModal(discord.ui.Modal, title="חיפוש שיר 🎵"):
    song = discord.ui.TextInput(
        label="איזה שיר אתה רוצה?",
        placeholder="לדוגמה: עומר אדם שיר חדש"
    )

    async def on_submit(self, interaction: discord.Interaction):
        if not interaction.user.voice:
            await interaction.response.send_message(
                "אתה חייב להיות בחדר קול",
                ephemeral=True
            )
            return

        await interaction.response.defer()

        channel = interaction.user.voice.channel
        vc = interaction.guild.voice_client

        if not vc:
            vc = await channel.connect()
        else:
            await vc.move_to(channel)

        song_info = search_song(self.song.value)

        url = song_info["url"]
        title = song_info["title"]

        source = await discord.FFmpegOpusAudio.from_probe(
            url,
            **ffmpeg_options
        )

        vc.stop()
        vc.play(source)

        await interaction.followup.send(
            f"▶ מנגן עכשיו: **{title}**"
        )


class MusicPanel(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)


    @discord.ui.button(
        label="🔎 בחר שיר",
        style=discord.ButtonStyle.primary
    )
    async def search(
        self,
        interaction: discord.Interaction,
        button: discord.ui.Button
    ):
        await interaction.response.send_modal(SearchModal())


    @discord.ui.button(
        label="⏸ השהה",
        style=discord.ButtonStyle.secondary
    )
    async def pause(
        self,
        interaction: discord.Interaction,
        button: discord.ui.Button
    ):
        vc = interaction.guild.voice_client

        if vc and vc.is_playing():
            vc.pause()
            await interaction.response.send_message(
                "⏸ המוזיקה נעצרה זמנית",
                ephemeral=True
            )


    @discord.ui.button(
        label="▶ המשך",
        style=discord.ButtonStyle.success
    )
    async def resume(
        self,
        interaction: discord.Interaction,
        button: discord.ui.Button
    ):
        vc = interaction.guild.voice_client

        if vc and vc.is_paused():
            vc.resume()
            await interaction.response.send_message(
                "▶ ממשיך לנגן",
                ephemeral=True
            )


    @discord.ui.button(
        label="⏭ דלג",
        style=discord.ButtonStyle.primary
    )
    async def skip(
        self,
        interaction: discord.Interaction,
        button: discord.ui.Button
    ):
        vc = interaction.guild.voice_client

        if vc:
            vc.stop()

        await interaction.response.send_message(
            "⏭ דילגתי",
            ephemeral=True
        )


    @discord.ui.button(
        label="⛔ עצור",
        style=discord.ButtonStyle.danger
    )
    async def stop(
        self,
        interaction: discord.Interaction,
        button: discord.ui.Button
    ):
        vc = interaction.guild.voice_client

        if vc:
            await vc.disconnect()

        await interaction.response.send_message(
            "⛔ עצרתי את המוזיקה",
            ephemeral=True
        )


@bot.command()
async def p(ctx):
    embed = discord.Embed(
        title="🎵 Music Panel",
        description="לחץ על הכפתור ובחר שיר לניגון",
        color=0x00ff00
    )

    await ctx.send(
        embed=embed,
        view=MusicPanel()
    )
    import os

bot.run(os.getenv("TOKEN"))
