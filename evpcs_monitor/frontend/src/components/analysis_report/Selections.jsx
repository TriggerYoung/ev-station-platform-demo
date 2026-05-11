// Selections.jsx:
import React from "react";
import { Select } from "antd";

const { Option } = Select;
const Selections = ({ selectedTimeUnit, setSelectedTimeUnit }) => {

    return (
        <Select
            value={selectedTimeUnit}
            onChange={setSelectedTimeUnit}
            style={{ width: "120px" }}
        >
            <Option value="hour">按小时汇总</Option>
            <Option value="day">按日汇总</Option>
            <Option value="month">按月汇总</Option>
            <Option value="year">按年汇总</Option>
        </Select>
    )

}

export default Selections;