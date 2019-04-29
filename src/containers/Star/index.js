import React, { Component } from "react";
import { Box, Masonry, Spinner } from "gestalt";
import StarHeader from "../../components/StarHeader";
import Pin from "../../components/PinItem";
import { getStarDetail } from "../../actions/starActions";
import { STAR_FETCH_SUCCESS } from "../../actionTypes/starActionTypes";
import store from "../../store";
import { getRecentImages as getStarImages } from "../../actions/pinsActions";
import * as until from "../../utils/star_util";

import StarTabs from "../../components/StarTabs";
import StarSort from "../../components/StarSort";
import "./index.scss";
export default class Star extends Component {
    constructor(props, context) {
        super(props, context);
        const { domain } = props.match.params;
        this.clientWidth = window.innerWidth;
        this.pre_index = 1;
        this.isFetching = false;
        this.current_page = 0;
        this.last_page = 2;
        this.state = {
            domain: domain,
            star: null,
            ins_count: 0,
            wb_count: 0,
            itemIndex: 1,
            open: false,
            sort_by: "time",
            time_sort: "desc",
            like_sort: "desc",
            show_layout: false,
            show_spinner: false,
            data: []
        };
        this.handleItemChange = this.handleItemChange.bind(this);
        this.hanleSortBy = this.hanleSortBy.bind(this);
        this.toggleLayout = this.toggleLayout.bind(this);
    }
    // 距离底部30px时，加载更多内容
    handleScroll() {
        let scrollTop = until.getScrollTop();
        let scrollHeight = until.getScrollHeight();
        let windowHeight = until.getWindowHeight();
        if (scrollTop + windowHeight + 30 > scrollHeight && !this.isFetching) {
            let type = this.state.sort_by;
            let sort =
                type === "time" ? this.state.time_sort : this.state.like_sort;
            this.getStarPins(type, sort);
        }
    }
    /**
     * 关闭或者打开排序的 layout 插件
     * @param {false,true} status
     */
    toggleLayout(status) {
        console.log(status);
        this.setState(prevState => ({
            show_layout: status ? !prevState.show_layout : false
        }));
    }
    /**
     * 监测 tab 的变化
     * @param {activeIndex} param0
     */
    handleItemChange(activeIndex) {
        if (this.pre_index !== activeIndex) {
            this.pre_index = activeIndex;
            this.setState(prevState => ({
                itemIndex: activeIndex
            }));
            this.current_page = 0;
            let _origin =
                activeIndex > 1
                    ? "others"
                    : activeIndex < 1
                    ? "微博"
                    : "instagram";
            // this.getPins(this,1,this.state.sort_by,activeIndex);
            this.getStarPins("time", "desc", _origin);
        }
    }

    /**
     * pins 排序
     * @param {tme,like} type
     * @param {desc, asc} sort
     */
    hanleSortBy(type, sort) {
        console.log(type);
        if (type === "time") {
            let pre_sort = this.state.time_sort;
            let next_sort = pre_sort === "desc" ? "asc" : "desc";
            this.setState(prevState => ({
                sort_by: "time",
                time_sort: next_sort,
                show_layout: false
            }));
            this.current_page = 0;
            this.getStarPins("time", next_sort);
        } else if (type === "like") {
            let pre_sort = this.state.like_sort;
            let next_sort = pre_sort === "desc" ? "asc" : "desc";
            this.setState(prevState => ({
                sort_by: "like",
                like_sort: next_sort,
                show_layout: false
            }));
            this.current_page = 0;
            this.getStarPins("like", next_sort);
        }
    }

    /**
     * 获取 star 详情
     */
    getStarDetail() {
        return new Promise((resolve, reject) => {
            store
                .dispatch(getStarDetail("/star/" + this.state.domain))
                .then(res => {
                    if (res.action_type === STAR_FETCH_SUCCESS) {
                        const {
                            star,
                            ins_count,
                            wb_count
                        } = store.getState().star;
                        console.log(store.getState().star)
                        this.setState({
                            star: star,
                            ins_count: ins_count,
                            wb_count: wb_count
                        });
                        console.log(ins_count,wb_count)
                        resolve({ status: 200, message: "success" });
                    }
                })
                .catch(error => {
                    console.log(error);
                    resolve({ status: 500, message: "fail" });
                });
        });
    }

    /**
     * 获取 star 的 pins
     * @param type
     * @param sort
     */
    getStarPins(type, sort, origin) {
        // url '/starImages/${name}'
        const item_idex = this.state.itemIndex;
        let _origin = "instagram";
        if (origin) {
            _origin = origin;
        } else {
            _origin =
                item_idex > 1 ? "others" : item_idex < 1 ? "微博" : "instagram";
        }
        let data = {
            origin: _origin,
            sort: sort,
            type: type
        };
        let page = this.current_page + 1;
        if (this.last_page < this.current_page) {
            return false;
        }
        this.setState({
            show_spinner: true
        })
        this.isFetching = true;
        store
            .dispatch(
                getStarImages("/starImages/" + this.state.domain, page, data)
            )
            .then(res => {
                const state = store.getState().pins;
                this.setState({
                    data: state.data,
                    show_spinner: false
                });
                this.current_page = state.current_page;
                this.last_page = state.last_page;
                this.isFetching = false;
            })
            .catch(error => {
                console.log(error);
                this.setState({
                    show_spinner: false
                });
            });
    }
    /**
     * 挂载成功后
     */
    componentDidMount() {
        this.getStarDetail().then(res => {
            if (res.status === 200) {
                // 加载 pins
                this.getStarPins("time", "desc", "instagram");
            } else {
                // try again
                this.getStarDetail();
            }
        });
        let _this = this;
        window.addEventListener("scroll", () => {
            _this.handleScroll();
        });
    }

    componentWillUnmount() { }
    
    render() {
        return (
            <div className="star_container">
                {this.state.star ? (
                    <StarHeader
                        {...this.state.star}
                        ins_count={this.state.ins_count}
                        wb_count={this.state.wb_count}
                        clientWidth={this.clientWidth}
                    />
                ) : null}
                {/* tabs */}
                <StarTabs
                    clientWidth={this.clientWidth}
                    itemIndex={this.state.itemIndex}
                    handleItemChange={this.handleItemChange}
                />
                {/* total and sortBy */}
                <StarSort
                    clientWidth={this.clientWidth}
                    time_sort={this.state.time_sort}
                    like_sort={this.state.like_sort}
                    sort_by={this.state.sort_by}
                    type_name={
                        this.state.itemIndex > 1
                            ? "其他图片"
                            : this.state.itemIndex < 1
                            ? "微博图片"
                            : "Ins 图片"
                    }
                    showLayout={this.state.show_layout}
                    hanleSortBy={this.hanleSortBy}
                    toggleLayout={this.toggleLayout}
                    total={
                        this.state.itemIndex > 1
                            ? 0
                            : this.state.itemIndex < 1
                            ? this.state.wb_count
                            : this.state.ins_count
                    }
                />
                {/* pins */}
                <div className="star_pinsContainer">
                    <Box paddingX={this.winWidth > 768 ? 8 : 2} marginTop={3}>
                        <Masonry
                            comp={Pin}
                            items={this.state.data}
                            loadItems={event => {}}
                            minCols={2}
                            gutterWidth={5}
                            flexible={true}
                        />
                        <Box marginBottom={6}>
                            <Spinner
                                accessibilityLabel={"Load more Pins"}
                                show={this.state.show_spinner}
                            />
                        </Box>
                    </Box>
                </div>
            </div>
        );
    }
}