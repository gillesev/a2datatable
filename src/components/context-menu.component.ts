import {
  AfterContentInit,
  ChangeDetectorRef,
  Component,
  ContentChildren,
  EventEmitter,
  HostListener,
  Inject,
  Input,
  Optional,
  Output,
  QueryList
} from '@angular/core';
import { CONTEXT_MENU_OPTIONS, IContextMenuOptions, ContextMenuService, IContextMenuClickEvent } from '../services';
import { ContextMenuItemDirective } from '../directives';
import { ContextMenuItemDescriptor } from '../models';

@Component({
  selector: 'context-menu',
  styles: [
  ],
  template:
  `<div class="dropdown">
      <ul *ngIf="item" [ngStyle]="locationCss" class="dropdown-menu">
        <li *ngFor="let menuItem of menuItems" [hidden]="!isMenuItemVisible(menuItem)" [class.disabled]="!isMenuItemEnabled(menuItem)">
          <a href [class.dropdown-item]="useBootstrap4" [class.disabled]="useBootstrap4 && !isMenuItemEnabled(menuItem)"
            (click)="menuItem.triggerExecute(item, $event); $event.preventDefault(); $event.stopPropagation();">
            <template 
              [ngTemplateOutlet]="menuItem.menuItemDetailTemplate" 
              [ngOutletContext]="{ context: { dataItem: item, menuDesc: menuItem.menuDescriptor }}"></template>
          </a>
        </li>
      </ul>
    </div>
  `,
})
/** The template iterates each menu item directive and uses a dynamic template 
 * (via the ngTemplateOutlet directive) to render each menu item detail. 
 * Note that the context that the menu item detail is bound to its template provides 
 * - the current selected data item row
 * - the menu item descriptor (e.g. 'View', 'Edit', 'Delete')
*/
export class ContextMenuComponent implements AfterContentInit {

  /** List of content menu item directives. */
  @ContentChildren(ContextMenuItemDirective) public menuItems: QueryList<ContextMenuItemDirective>;
  @Input() public useBootstrap4: boolean = false;
  @Output() public close: EventEmitter<any> = new EventEmitter<any>();
  
  public isShown: boolean = false;
  public isOpening: boolean = false;

  /** Represents the data item row associated with the context menu. */
  public item: any;

  private mouseLocation: { left: number, top: number } = { left: 0, top: 0 };
  
  constructor(
    private _contextMenuService: ContextMenuService,
    private changeDetector: ChangeDetectorRef,
    @Optional()
    @Inject(CONTEXT_MENU_OPTIONS) private options: IContextMenuOptions
  ) {
    if (options) {
      this.useBootstrap4 = options.useBootstrap4;
    }

    // This is where we do subscribe to the subject {show}. When the DOM [menuitem] event will fire, the context menu directive handler will call .next on the subject.
    _contextMenuService.show.subscribe(menuEvent => this.onMenuEvent(menuEvent));
  }

  get locationCss(): any {
    return {
      'position': 'fixed',
      'display': this.isShown ? 'block' : 'none',
      left: this.mouseLocation.left + 'px',
      top: this.mouseLocation.top + 'px',
    };
  }

  @HostListener('document:click')
  @HostListener('document:contextmenu')
  public clickedOutside(): void {
    if (!this.isOpening) {
      this.hideMenu();
    }
  }

  public ngAfterContentInit(): void {
    // this.menuItems is NOT available before ngAfterContentInit life-cycle event.
    this.menuItems.forEach(menuItem => {
      menuItem.execute.subscribe(() => this.hideMenu());
    });
  }

  /** Determines if a context menu item is enabled. */
  public isMenuItemEnabled(menuItem: ContextMenuItemDirective): boolean {
    return menuItem.isEnabled(this.item);
  }

  /** Determines if a context menu item is visible. */
  public isMenuItemVisible(menuItem: ContextMenuItemDirective): boolean {
    return menuItem.isVisible(this.item);
  }

  /** Handles the [menuitem] event  */
  public onMenuEvent(menuEvent: IContextMenuClickEvent): void {
    let { contextMenu, event, item } = menuEvent;
    if (contextMenu && contextMenu !== this) {
      this.hideMenu();
      return;
    }

    this.isOpening = true;
    setTimeout(() => this.isOpening = false, 400);

    if (this.menuItems) {
      setTimeout(() => {
        // check if at least one context menu item is visible.
        if (this.menuItems.filter(menuItem => this.isMenuItemVisible(menuItem)).length > 0) {
          this.showMenu();
        } else {
          this.hideMenu();
        }
      });
    } else {
      this.hideMenu();
    }

    // sets the current data item row.
    this.item = item;
    this.mouseLocation = {
      left: event.clientX,
      top: event.clientY,
    };
  }

  public showMenu(): void {
    this.isShown = true;
    this.changeDetector.markForCheck();
  }

  public hideMenu(): void {
    if (this.isShown === true) {
      this.close.emit({});
    }
    this.isShown = false;
    this.changeDetector.markForCheck();
  }
}
