import {Directive, Input, Output, EventEmitter, TemplateRef} from '@angular/core';
import { ContextMenuItemDescriptor } from '../models';

@Directive({
  /* tslint:disable:directive-selector-type */
  selector: 'template[contextMenuItem]',
  /* tslint:enable:directive-selector-type */
})
export class ContextMenuItemDirective {
  /** Function definition to determine if a context menu item can be enabled for a specific data item row.
   * Note it also can be a flag. 
  */
  @Input() public enabled: boolean | ((item: any, ctxtMenuDef: ContextMenuItemDescriptor) => boolean) = true;

  /** Function definition to determine if a context menu item can be visible for a specific data item row. 
   * Note it also can be a flag.
  */
  @Input() public visible: boolean | ((item: any, ctxtMenuDef: ContextMenuItemDescriptor) => boolean) = true;

  /** Represents the context menu definition (e.g. for example: 'View' or 'Edit')  */
  @Input() public menuDescriptor: ContextMenuItemDescriptor;

  /** Emits the [execute] event when a context menu item is selected/clicked on. */
  @Output() public execute: EventEmitter<{ event: Event, item: any }> = new EventEmitter<{ event: Event, item: any }>();

  /** Template reference used to render the menu item details. */
  @Input() public menuItemDetailTemplate: TemplateRef<{ menuDesc: any }>;

  /** Called when a menu item is selected/clicked. */
  public triggerExecute(item: any, $event?: MouseEvent): void {
    this.execute.emit({event: $event, item});
  }

  /** Executes the visible function. */
  public isVisible(item: any): boolean {
    if (this.visible instanceof Function) {
      return this.visible(item, this.menuDescriptor);
    }
    return <boolean>this.visible;    
  }

  /** Executes the enabled function. */
  public isEnabled(item: any): boolean {
    if (this.enabled instanceof Function) {
      return this.enabled(item, this.menuDescriptor);
    }
    return <boolean>this.enabled;    
  }
}
