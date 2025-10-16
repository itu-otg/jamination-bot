import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { EmbedBuilder } from 'discord.js';

@ApplyOptions<Command.Options>({
  name: 'jam-durum',
	description: 'Jam sürecinde aktif durumu listelemek için bu komutu kullanın',
  preconditions: ["GuildOnly", "JamManagerOnly"]
})
export class UserCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder //
				.setName(this.name)
				.setDescription(this.description)
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const jamTeamCount = await this.container.db.jamTeam.count();
    const jamMemberCount = await this.container.db.jamTeamMember.count();

    const embed = new EmbedBuilder()
		.setTitle('Jamination İstatikleri') // Title of the embed
		.setColor(0x7f91bd) // Optional color
		.addFields(
			{ name: 'Takım Sayısı', value: `${jamTeamCount}`, inline: true },
			{ name: 'Takım Üyesi sayısı', value: `${jamMemberCount}`, inline: true }
		)
		.setFooter({ text: 'Jamination Bot', iconURL: interaction.client.user?.displayAvatarURL() })
		.setTimestamp();

	await interaction.reply({ embeds: [embed] });

	}
}
