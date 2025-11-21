import { Item } from '../types';

export interface Template {
    id: string;
    name: string;
    items: Omit<Item, 'id' | 'completed'>[];
}

export const templates: Template[] = [
    {
        id: 'grocery',
        name: 'Grocery List',
        items: [
            { text: 'Milk' },
            { text: 'Eggs' },
            { text: 'Bread' },
            { text: 'Butter' },
            { text: 'Cheese' },
            { text: 'Vegetables' },
            { text: 'Fruits' },
        ]
    },
    {
        id: 'gym',
        name: 'Gym Pack',
        items: [
            { text: 'Water Bottle' },
            { text: 'Towel' },
            { text: 'Headphones' },
            { text: 'Gym Shoes' },
            { text: 'Change of Clothes' },
            { text: 'Deodorant' },
            { text: 'Lock' },
        ]
    },
    {
        id: 'weekend-trip',
        name: 'Weekend Trip',
        items: [
            { text: 'Passport/ID' },
            { text: 'Tickets' },
            { text: 'Chargers' },
            { text: 'Toiletries' },
            { text: 'Underwear' },
            { text: 'Socks' },
            { text: 'Pajamas' },
            { text: 'Outfits' },
        ]
    },
    {
        id: 'cleaning',
        name: 'Cleaning',
        items: [
            { text: 'Vacuum' },
            { text: 'Mop floors' },
            { text: 'Dust shelves' },
            { text: 'Clean bathroom' },
            { text: 'Clean kitchen' },
            { text: 'Change sheets' },
            { text: 'Take out trash' },
        ]
    }
];
