/** Data table context menu descriptor */
export class ContextMenuItemDescriptor {
    /** Unique identifier for the context menu item */
    public id: number;

    /** Rendering order for the context menu item. No two different menu items with the same id can share the same order. */
    public order: number;

    /** Description that will be rendered in the popup */
    public description: string;
}
