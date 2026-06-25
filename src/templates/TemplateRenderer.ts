import Handlebars from 'handlebars';

export function renderTemplate(templateHtml: string, data: Record<string, unknown>): string {
    const template = Handlebars.compile(templateHtml);
    return template(data);
}
