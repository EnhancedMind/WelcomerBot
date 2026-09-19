const { EventEmitter } = require('node:events');
const { Message, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { consoleLog } = require("../Data/Log");

/**
 * @typedef {Object} ButtonPromptOptions
 * @property {Message} message The original context message sent by the user.
 * @property {Message} [existingMessage] An existing message to edit instead of sending a new one.
 * @property {string|Object} content Plain text content or payload object
 * @property {Array<{ id: string, label?: string, style?: string|number, emoji?: string }>} buttons
 * @property {boolean} [deferUpdate=true] Whether the collector should deferUpdate the intercation automatically. default true
 * @property {boolean} [resetTimer=true] Whether the collector should reset its timeout timer automatically. default true
 * @property {number} [timeout=30000] The idle time window in milliseconds before the collector deactivates.
 */

class ButtonPrompt extends EventEmitter {
    static #activePrompts = new Set();

    /**
     * @param {ButtonPromptOptions} options Configuration options for the buttonprompt session.
     * @throws {Error}
     */
    constructor(options) {
        super();

        if (!options.message?.channel) throw new Error('Channel is inaccessible.');
        if (!options.buttons || options.buttons.length === 0) throw new Error('Buttons are required.');
        if (!options.content) throw new Error('Cannot send an empty message');

        this.message = options.message;
        this.existingMessage = options.existingMessage || null;
        this.content = options.content;
        this.buttonConfigs = options.buttons;
        this.deferUpdate = options.deferUpdate ?? true;
        this.resetTimer = options.resetTimer ?? true;
        this.timeout = options.timeout || 30000;

        this.sentMessage = null;
        this.collector = null;
    }

    /**
     * Instantiates and automatically kicks off an active reaction-based message with button prompt.
     * @param {ButtonPromptOptions} options Configuration options for the prompt session.
     * @returns {Promise<ButtonPrompt|undefined>}
     */
    static async create(options) {
        try {
            const prompt = new ButtonPrompt(options);
            await prompt.#start();
            return prompt;
        }
        catch (error) {
            consoleLog('ButtonPrompt failed:\n', error);
            options.message.channel.send(`The button prompt handler failed. :( \`${error?.message}\``).catch(() => {});
        }
    }

    /**
     * Destroys all currently active buttonprompts, returns array of promises of all destroys
     * @returns {Array[Promise]}
     */
    static destroyAll() {
        return Array.from(ButtonPrompt.#activePrompts).map((instance) => instance.destroy());
    }

    /**
     * DESTROYYYYYYYYYYYY
     * @param {boolean} [editMessage=true] whether to update the message with disabled components
     */
    async destroy(editMessage = true) {
        if (this.collector && !this.collector.ended) this.collector.stop('destroyed');

        ButtonPrompt.#activePrompts.delete(this);

        if (editMessage && this.sentMessage?.editable) await this.sentMessage.edit(this.#getMessagePayload(true)).catch(() => {});
    }

    /**
     * Maps shorthand style names to Discord.js ButtonStyle enums.
     * @private
     */
    #getStyle(style) {
        if (typeof style === 'number') return style;
        const styleMap = {
            primary: ButtonStyle.Primary,
            secondary: ButtonStyle.Secondary,
            success: ButtonStyle.Success,
            danger: ButtonStyle.Danger,
            link: ButtonStyle.Link
        };
        return styleMap[style?.toLowerCase()] || ButtonStyle.Primary;
    }

    /**
     * Gets the component action row buttons
     * @param {boolean} disabled - whether the components should be disabled
     * @private
     */
    #getComponents(disabled = false) {
        const rows = [];
        let currentRow = new ActionRowBuilder();

        for (const btn of this.buttonConfigs) {
            if (currentRow.components.length == 5) {
                rows.push(currentRow);
                currentRow = new ActionRowBuilder();
            }

            if (rows.length == 5) break;

            const builder = new ButtonBuilder()
                .setCustomId(btn.id)
                .setStyle(this.#getStyle(btn.style))
                .setDisabled(disabled);

            if (btn.label) builder.setLabel(btn.label);
            if (btn.emoji) builder.setEmoji(btn.emoji);

            currentRow.addComponents(builder);
        }

        // push the final row if it contains any remaining buttons
        if (currentRow.components.length > 0 && rows.length < 5) {
            rows.push(currentRow);
        }

        return rows;
    }

    /**
     * Formats the final message payload structure for edits/sends.
     * @param {boolean} disabled - whether the components should be disabled
     * @returns {Object} - discord.js compatible message payload object
     * @private
     */
    #getMessagePayload(disabled = false) {
        const base = typeof this.content === 'string' ? { content: this.content } : { ...this.content };
        return {
            ...base,
            components: this.#getComponents(disabled)
        }
    }

    /**
     * Dispatches the message and attaches the event listening loop.
     * @private
     */
    async #start() {
        try {
            if (this.existingMessage) this.sentMessage = await this.existingMessage.edit(this.#getMessagePayload());
            else this.sentMessage = await this.message.channel.send(this.#getMessagePayload());
        }
        catch (error) {
            this.removeAllListeners();
            throw error; // pass up to .create to handle there
        }
        

        // track instance in set
        ButtonPrompt.#activePrompts.add(this);

        this.collector = this.sentMessage.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: this.timeout
        });

        this.collector.on('collect', async (interaction) => {
            if (interaction.user.id != this.message.author.id) {
                await interaction.reply({ content: `You cannot interact with this button prompt. Only its author <@${this.message.author.id}> can.`, flags: MessageFlags.Ephemeral }).catch(() => {});
                return;
            }

            if (this.deferUpdate) interaction.deferUpdate().catch(() => {});
            if (this.resetTimer) this.collector.resetTimer();
            // emit a general 'click' event on every press
            this.emit('click', interaction, interaction.customId);

            // also emit a specific event named after the button id
            this.emit(interaction.customId, interaction);
        });

        this.collector.on('end', (_, reason) => {
            ButtonPrompt.#activePrompts.delete(this);

            if (reason !== 'destroyed' && !reason.endsWith('Delete')) {
                this.sentMessage.edit(this.#getMessagePayload(true)).catch(() => {});
            }

            this.emit('end', reason);
            this.removeAllListeners();
        });
    }
}

module.exports = ButtonPrompt;
