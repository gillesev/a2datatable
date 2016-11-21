import { Injectable } from '@angular/core';
import { ContextMenuItemDescriptor } from '../models';

@Injectable()
/** Data table context menu configuration service.
 * used to inject the menu descriptors to the data component.
 */
export class DataTableContextMenuConfig {
    private _config: Array<ContextMenuItemDescriptor>;

    get menuDescriptors(): Array<ContextMenuItemDescriptor> {
        return this._config;
    }

    constructor(config: Array<ContextMenuItemDescriptor>) {
        this._config = config;
    }
}
