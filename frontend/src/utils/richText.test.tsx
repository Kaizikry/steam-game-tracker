import { render } from '@testing-library/react';
import { RichText } from './richText';

describe('RichText', () => {
    it('renders bold, italic and bullets', () => {
        const { container } = render(
            <RichText
                text={'Stuck at **Malenia**, try *bleed*\n- level Vigor\n- get Mimic Tear'}
            />,
        );
        expect(container.querySelector('strong')?.textContent).toBe('Malenia');
        expect(container.querySelector('em')?.textContent).toBe('bleed');
        expect([...container.querySelectorAll('li')].map((li) => li.textContent)).toEqual([
            'level Vigor',
            'get Mimic Tear',
        ]);
    });

    it('never injects HTML from notes', () => {
        const { container } = render(
            <RichText text={'<img src=x onerror=alert(1)> **<b>hi</b>**'} />,
        );
        expect(container.querySelector('img')).toBeNull();
        expect(container.querySelector('b')).toBeNull();
        expect(container.textContent).toContain('<img src=x onerror=alert(1)>');
    });
});
