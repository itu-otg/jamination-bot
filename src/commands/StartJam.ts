import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { ChannelType, EmbedBuilder } from 'discord.js';

@ApplyOptions<Command.Options>({
	name: 'ayarla',
	description: 'Jamination Zamanı! Botu ayarlamak için bu komutu kullan',
	preconditions: ['OwnerOnly', 'GuildOnly']
})
export class StartJam extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder //
				.setName(this.name)
				.setDescription(this.description)
				.addRoleOption((b) => {
					return b.setName('mod-role').setDescription('Moderatör Rolü').setRequired(true);
				})
				.addChannelOption((b) => {
					return b.setName('notification-channel').setDescription('Bildirim Kanalı').setRequired(true);
				})
				.addChannelOption((b) => {
					return b.setName('positionette').setDescription('Ekip kanalları pozisyonlama kategorisi').setRequired(true);
				})
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const modRole = interaction.options.getRole('mod-role');
		const notificationChannel = interaction.options.getChannel('notification-channel');
		const positionette = interaction.options.getChannel('positionette');

    if (positionette && positionette.type !== ChannelType.GuildCategory) {
      return interaction.reply({ content: "Pozisyonlama parametresi sadece categori kabul eder."})
    }

		const res = await this.setJamServerSettings(
			interaction.guildId!,
			modRole!.id,
			notificationChannel!.id.toString(),
			positionette!.id.toString()
		);

    const embed = new EmbedBuilder()
      .setTitle('✅ Jamination Ayarları Kaydedildi')
      .setDescription('Sunucu ayarları başarıyla kaydedildi:')
      .setColor(0x00AE86)
      .addFields(
        { name: 'Guild ID', value: res.guildID.toString(), inline: false },
        { name: 'Admin Role', value: `<@&${res.adminRoleID}>`, inline: true },
        { name: 'Bildirim Kanalı', value: `<#${res.jamPositionateChannelID}>`, inline: true },
        { name: 'Pozisyonlama Kategorisi', value: `<#${res.jamPositionateChannelID}>`, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'Jamination Bot', iconURL: interaction.client.user?.displayAvatarURL() ?? undefined });


		return interaction.reply({ embeds: [embed] });
	}

	private setJamServerSettings(guildID: string, modRole: string, notificationChannel: string, positionette: string) {
		return this.container.db.guildSettings.create({
			data: {
				guildID: guildID.toString(),
				adminRoleID: modRole.toString(),
        notificationChannelID: notificationChannel,
				jamPositionateChannelID: positionette.toString(),
        isActive: true,
			}
		});
	}
}
