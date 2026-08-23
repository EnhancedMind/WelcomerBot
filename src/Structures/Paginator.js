const { Message, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require("discord.js");
const { consoleLog } = require("../Data/Log");

/**
 * @typedef {Object} PaginatorOptions
 * @property {Message} message The original context message sent by the user.
 * @property {[EmbedBuilder]} pages An array of EmbedBuilder instances representing the pages.
 * @property {String} [messageContent=null] Optional plain text content to display alongside the embeds.
 * @property {Number} [page=0] The initial zero-based page index to display when starting.
 * @property {number} [timeout=90000] The idle time window in milliseconds before the collector deactivates.
 */

class Paginator {
    static #activePaginators = new Set();

    /**
     * 
     * @param {PaginatorOptions} options Configuration options for the pagination session.
     * @throws {Error}
     */
    constructor(options) {
        if (!options.message?.channel) throw new Error("Channel is inaccessible.");
        if (!options.pages || !options.pages.length) throw new Error("Pages are not given.");

        this.message = options.message;
        this.pages = options.pages;
        this.messageContent = options.messageContent || null;

        const requestedPage = Math.round(options.page) || 0;
        this.page = Math.max(0, Math.min(requestedPage, this.pages.length - 1));
        this.timeout = options.timeout || 90000;

        this.components = [];
        this.componentsDisabled = undefined;
        this.curPage = null;
        this.collector = null;
    }

    /**
     * Instantiates and automatically kicks off an active reaction-based paginator message.
     * @param {PaginatorOptions} options Configuration options for the pagination session.
     * @returns {Promise<Paginator|undefined>}
     * @throws {Error}
     */
    static async create(options) {
        try {
            const instance = new Paginator(options);
            await instance.#start();
            return instance;
        }
        catch (error) {
            consoleLog('Paginator failed:\n', error);
            options.message.channel.send(`The paginator failed. :( \`${error?.message}\``).catch(() => {});
        }
    }

    /**
     * Destroys all currently active paginators
     * @returns {Promise<undefined>}
     */
    static async destroyAll() {
        const destroyPromises = Array.from(Paginator.#activePaginators).map(instance => instance.destroy());
        await Promise.allSettled(destroyPromises);
    }

    /**
     * DESTROYYYYYYYYYYYY
     */
    async destroy() {
        if (this.collector && !this.collector.ended) this.collector.stop('destroyed');

        Paginator.#activePaginators.delete(this);

        if (this.curPage?.editable) await this.curPage.edit(this.#getMessagePayload(this.page, true)).catch(() => {});
    }

    /**
     * Gets the component action row buttons
     * @param {boolean} disabled - whether the components should be disabled
     * @private
     */
    #getComponents(disabled = false) {
        if (this.components.length && this.componentsDisabled === disabled) return this.components;

        this.componentsDisabled = disabled;
        this.components = [];

        this.components.push(
            new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('paginator_prev').setEmoji('◀️').setLabel('Previous page').setStyle(ButtonStyle.Primary).setDisabled(disabled),
                new ButtonBuilder().setCustomId('paginator_next').setEmoji('▶️').setLabel('Next page').setStyle(ButtonStyle.Primary).setDisabled(disabled),
                new ButtonBuilder().setCustomId('paginator_stop').setEmoji('⏹️').setLabel('Stop Paginator').setStyle(ButtonStyle.Danger).setDisabled(disabled)
            )
        );

        if (this.pages.length > 3) this.components.push(
            new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder().setCustomId('paginator_select').setPlaceholder('Select page').setDisabled(disabled)
                    .addOptions(
                        this.pages.slice(0, 25).map((_, i) => (
                            { label: `Page ${i + 1}`, value: String(i) }
                        ))
                    )
            )
        );

        return this.components;
    }

    /**
     * Formats the final message payload structure for edits/sends.
     * @param {number} index Target index page from the pages library.
     * @param {boolean} disabledComponents - whether the components should be disabled
     * @returns {{content: (string|null), embeds: EmbedBuilder[]}} Formatted message options object payload.
     * @private
     */
    #getMessagePayload(index, disabledComponents = false) {
        const embedCopy = EmbedBuilder.from(this.pages[index]);
        return {
            content: this.messageContent,
            embeds: [ embedCopy.setFooter({ text: `Page ${index + 1} / ${this.pages.length}` }) ],
            components: this.pages.length > 1 ? this.#getComponents(disabledComponents) : []
        };
    }

    /**
     * Dispatches the initial message state and attaches the event listening loop.
     * @private
     */
    async #start() {
        this.curPage = await this.message.channel.send(this.#getMessagePayload(this.page));
        if (this.pages.length == 1) return;

        // track instance in set
        Paginator.#activePaginators.add(this);

        const filter = (interaction) => interaction.user.id == this.message.author.id;

        this.collector = this.curPage.createMessageComponentCollector({
            filter,
            time: this.timeout
        });


        this.collector.on('collect', async (interaction) => {
            switch (interaction.customId) {
                case 'paginator_prev':
                    this.page = this.page > 0 ? this.page - 1 : this.pages.length - 1;
                    break;

                case 'paginator_next':
                    this.page = this.page + 1 < this.pages.length ? this.page + 1 : 0;
                    break;

                case 'paginator_stop':
                    interaction.deferUpdate().catch(() => {});
                    this.destroy();
                    return;

                case 'paginator_select':
                    this.page = parseInt(interaction.values[0], 10);
                    break;
            }

            await interaction.update(this.#getMessagePayload(this.page)).catch(() => {});
            this.collector.resetTimer();
        });

        this.collector.on('end', (_, reason) => {
            if (reason == 'destroyed') return;

            Paginator.#activePaginators.delete(this);

            if (reason.endsWith('Delete')) return;

            this.curPage.edit(this.#getMessagePayload(this.page, true)).catch(() => {});
        });
    }
}

module.exports = Paginator;
