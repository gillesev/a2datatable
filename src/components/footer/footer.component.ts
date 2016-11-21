import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { NgbPaginationConfig } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'datatable-footer',
    template: `
        <div [style.height.px]="footerHeight">
            <div>{{rowCount.toLocaleString()}} {{totalMessage}}</div>
            <div class="pager">
                <ngb-pagination 
                    [collectionSize]="rowCount"
                    [boundaryLinks]="boundaryLinks" 
                    [directionLinks]="directionLinks"
                    [ellipses]="ellipses"
                    [page]="curPage"
                    [pageSize]="pageSize"
                    [rotate]="rotate"
                    [size]="size"
                    (pageChange)='page.emit({ page: $event})'>
                </ngb-pagination>
            </div>
        </div>
    `,
    providers: [NgbPaginationConfig],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataTableFooterComponent {

    /** Height for the Data Component Footer. */ 
    @Input() footerHeight: number;
    
    /** Data result set count. */
    @Input() rowCount: number;

    /** Data page offset (start at 0). */
    @Input() offset: number;

    /** NgbPaginationConfig boundaryLinks wrapper. */
    @Input() boundaryLinks: boolean;

    /** NgbPaginationConfig directionLinks wrapper. */
    @Input() directionLinks: boolean;

    /** NgbPaginationConfig ellipses wrapper. */
    @Input() ellipses: boolean;

    /** NgbPaginationConfig pageSize wrapper. */
    @Input() pageSize: number;

    /** NgbPaginationConfig rotate wrapper. */
    @Input() rotate: boolean;

    /** NgbPaginationConfig size = "sm | lg" wrapper. */
    @Input() size: "sm" | "lg";

    /** Custom message to render Data result set count. */
    @Input() totalMessage: string;

    /** Event Emitter used when the page selection is changed. */
    @Output() page: EventEmitter<any> = new EventEmitter();

    /** Internal activate Event Emitter used to propagate event to parent Data Component. */
    @Output() activate: EventEmitter<any> = new EventEmitter();

    /** Current selected page (related to the offset property) */
    get curPage(): number {
        return this.offset + 1;
    }

    /** Use NgbPaginationConfig to default pagination initialization. */
    constructor(private _config: NgbPaginationConfig) {
        this.offset = 0;
        this.boundaryLinks = _config.boundaryLinks;
        this.directionLinks = _config.directionLinks;
        this.ellipses = _config.ellipses;
        this.pageSize = _config.pageSize;
        this.rotate = _config.rotate;
        this.size = _config.size ? _config.size : "sm";
    }
}