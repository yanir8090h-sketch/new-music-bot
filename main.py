import discord
from discord.ext import commands
import yt_dlp
import asyncio

intents = discord.Intents.default()
intents.message_content = True
intents.voice_states = True

bot = commands.Bot(command_prefix="m!", intents=intents)

FFMPEG_OPTIONS = {
    "options": "-vn"
}

YDL_OPTIONS = {
    "format": "bestaudio/best",
    "quiet": True,
    "noplaylist": True,
    "extract_flat": False
}


class MusicPanel(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)


    @discord.ui.button(label="🎵 נגן שיר", style=discord.ButtonStyle.green)
    async def play(self, interaction: discord.Interaction, button):

        await interaction.response.send_message(
            "שלח קישור YouTube לשיר:",
            ephemeral=True
        )

        def check(msg):
            return (
                msg.author == interaction.user
                and msg.channel == interaction.channel
            )

        try:
            msg = await bot.wait_for(
                "message",
                check=check,
                timeout=60
            )

            if not interaction.user.voice:
                await interaction.followup.send(
                    "❌ אתה חייב להיות בוויס"
                )
                return


            channel = interaction.user.voice.channel

            vc = interaction.guild.voice_client


            if vc is None:
                vc = await channel.connect(
                    timeout=60,
                    reconnect=True
                )

            elif vc.channel != channel:
                await vc.move_to(channel)


            with yt_dlp.YoutubeDL(YDL_OPTIONS) as ydl:

                info = ydl.extract_info(
                    msg.content,
                    download=False
                )

                if "entries" in info:
                    info = info["entries"][0]

                audio_url = info["url"]
                title = info.get(
                    "title",
                    "שיר"
                )


            if vc.is_playing():
                vc.stop()


            source = discord.FFmpegPCMAudio(
                audio_url,
                **FFMPEG_OPTIONS
            )


            vc.play(source)


            await interaction.followup.send(
                f"🎶 מנגן עכשיו: **{title}**"
            )


        except asyncio.TimeoutError:
            await interaction.followup.send(
                "⌛ לא שלחת קישור בזמן"
            )


        except Exception as e:
            await interaction.followup.send(
                f"❌ שגיאה:\n```{e}```"
            )



    @discord.ui.button(label="⏸ השהה", style=discord.ButtonStyle.blurple)
    async def pause(self, interaction, button):

        vc = interaction.guild.voice_client

        if vc and vc.is_playing():
            vc.pause()
            await interaction.response.send_message(
                "⏸ הושהה"
            )
        else:
            await interaction.response.send_message(
                "אין שיר שמתנגן"
            )



    @discord.ui.button(label="▶ המשך", style=discord.ButtonStyle.green)
    async def resume(self, interaction, button):

        vc = interaction.guild.voice_client

        if vc and vc.is_paused():
            vc.resume()
            await interaction.response.send_message(
                "▶ המשכתי"
            )
        else:
            await interaction.response.send_message(
                "אין שיר מושהה"
            )



    @discord.ui.button(label="⏭ דלג", style=discord.ButtonStyle.gray)
    async def skip(self, interaction, button):

        vc = interaction.guild.voice_client

        if vc:
            vc.stop()

        await interaction.response.send_message(
            "⏭ דילגתי"
        )



    @discord.ui.button(label="⛔ עצור", style=discord.ButtonStyle.red)
    async def stop(self, interaction, button):

        vc = interaction.guild.voice_client

        if vc:
            await vc.disconnect()

        await interaction.response.send_message(
            "⛔ עצרתי"
        )



@bot.command()
async def p(ctx):

    embed = discord.Embed(
        title="🎵 מערכת מוזיקה",
        description="בחר פעולה:",
        color=discord.Color.blue()
    )

    await ctx.send(
        embed=embed,
        view=MusicPanel()
    )



@bot.event
async def on_ready():
    print(
        f"הבוט מחובר בתור {bot.user}"
    )

import os

bot.run(os.getenv("TOKEN"))
