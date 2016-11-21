import { Directive, HostListener, Input } from '@angular/core';
import { ContextMenuComponent } from '../components';
import { ContextMenuService } from '../services';

@Directive({
  selector: '[contextMenu]',
})
/** Directive used to describe to which Context Menu component your component wants attachs to. */
export class ContextMenuAttachDirective {
  @Input() public contextMenuSubject: any;
  @Input() public contextMenu: ContextMenuComponent;

  constructor(private contextMenuService: ContextMenuService) { }

  @HostListener('contextmenu', ['$event'])
  public onContextMenu(event: MouseEvent): void {
    this.contextMenuService.show.next({
      contextMenu: this.contextMenu,
      event,
      item: this.contextMenuSubject
    });
    event.preventDefault();
    event.stopPropagation();
  }
}
