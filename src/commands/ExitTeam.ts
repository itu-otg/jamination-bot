import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder
} from 'discord.js';

@ApplyOptions<Command.Options>({
  name: 'takımdan-çık',
  description: 'Şu anki ekibinizden çıkmak için kullanabilirsiniz!',
  preconditions: ['GuildOnly', 'TeamMemberOnly']
})
export class UserCommand extends Command {
  #successEmbed = new EmbedBuilder()
    .setTitle('Takımdan ayrıldınız!')
    .setDescription('Artık bu takımın bir üyesi değilsiniz. İsterseniz başka bir takıma katılabilirsiniz.')
    .setColor(0x7f91bd)
    .setTimestamp();

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
    );
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const team = await this.container.db.jamTeam.findFirst({
      where: { members: { some: { userID: interaction.user.id } } },
      include: { members: true }
    });

    if (!team) {
      return interaction.reply({ content: 'Herhangi bir takımda değilsiniz.', ephemeral: true });
    }

    // Create confirmation modal
    const modal = new ModalBuilder()
      .setCustomId('confirm-leave-team')
      .setTitle('Takımdan Ayrılmayı Onayla');

    const confirmInput = new TextInputBuilder()
      .setCustomId('confirmation')
      .setLabel('Onaylamak için "AYRIL" yazın')
      .setPlaceholder('AYRIL')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const row = new ActionRowBuilder<TextInputBuilder>().addComponents(confirmInput);
    modal.addComponents(row);

    await interaction.showModal(modal);

    try {
      const modalInteraction = await interaction.awaitModalSubmit({
        time: 60_000,
        filter: (i) => i.customId === 'confirm-leave-team' && i.user.id === interaction.user.id
      });

      const confirmation = modalInteraction.fields.getTextInputValue('confirmation');
      if (confirmation !== 'AYRIL') {
        return modalInteraction.reply({
          content: 'İşlem iptal edildi. Onaylamak için **AYRIL** yazmanız gerekiyor.',
          ephemeral: true
        });
      }

      // Remove the member
      await this.container.db.jamTeamMember.deleteMany({
        where: { userID: interaction.user.id, teamID: team.id }
      });

      return modalInteraction.reply({ embeds: [this.#successEmbed] });
    } catch (error) {
      this.container.logger.error(error);
      return interaction.followUp({
        content: 'Onay süresi doldu veya bir hata oluştu.',
        ephemeral: true
      });
    }
  }
}

