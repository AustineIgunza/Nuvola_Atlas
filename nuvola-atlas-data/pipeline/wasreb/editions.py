"""One entry per IMPACT report edition. This is the registry the downloader,
extractors and validation report all iterate over."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Final


@dataclass(frozen=True)
class EditionSpec:
    """A single IMPACT report edition.

    ``issue`` is the sequential number WASREB assigns (1..17).
    ``fiscal_year`` is the year the data covers (``"FY2022/23"``), NOT the
    year the report was published, because a value's `fy` in the long CSV
    is the year it describes.
    ``url`` is the direct link recorded when the edition was fetched.
    ``sha256`` starts empty and is filled in by ``downloader.fetch`` so a
    rerun produces an audit trail without secondary state files.
    """

    issue: int
    fiscal_year: str
    published: str          # ISO date the report itself was released
    url: str
    sha256: str | None = None
    notes: str | None = None


# Skeleton registry. URLs and sha256s are filled in by ``downloader.fetch``
# on first run; a rerun re-verifies the sha256. Editions 1-15 published
# their FYs sequentially; the more recent issues occasionally re-report a
# prior FY, which is why ``fiscal_year`` is spelled out per edition.
EDITIONS: Final[tuple[EditionSpec, ...]] = (
    EditionSpec(issue=17, fiscal_year="FY2023/24", published="2025-06-30",
                url="https://wasreb.go.ke/downloads/Impact_Report_Issue_17.pdf"),
    EditionSpec(issue=16, fiscal_year="FY2022/23", published="2024-06-30",
                url="https://wasreb.go.ke/downloads/Impact_Report_Issue_16.pdf"),
    EditionSpec(issue=15, fiscal_year="FY2021/22", published="2023-06-30",
                url="https://wasreb.go.ke/downloads/Impact_Report_Issue_15.pdf"),
    EditionSpec(issue=14, fiscal_year="FY2020/21", published="2022-06-30",
                url="https://wasreb.go.ke/downloads/Impact_Report_Issue_14.pdf"),
    EditionSpec(issue=13, fiscal_year="FY2019/20", published="2021-06-30",
                url="https://wasreb.go.ke/downloads/Impact_Report_Issue_13.pdf"),
    EditionSpec(issue=12, fiscal_year="FY2018/19", published="2020-06-30",
                url="https://wasreb.go.ke/downloads/Impact_Report_Issue_12.pdf"),
    EditionSpec(issue=11, fiscal_year="FY2017/18", published="2019-06-30",
                url="https://wasreb.go.ke/downloads/Impact_Report_Issue_11.pdf"),
    EditionSpec(issue=10, fiscal_year="FY2016/17", published="2018-06-30",
                url="https://wasreb.go.ke/downloads/Impact_Report_Issue_10.pdf"),
    EditionSpec(issue=9,  fiscal_year="FY2015/16", published="2017-06-30",
                url="https://wasreb.go.ke/downloads/Impact_Report_Issue_9.pdf"),
    EditionSpec(issue=8,  fiscal_year="FY2014/15", published="2016-06-30",
                url="https://wasreb.go.ke/downloads/Impact_Report_Issue_8.pdf"),
    EditionSpec(issue=7,  fiscal_year="FY2013/14", published="2015-06-30",
                url="https://wasreb.go.ke/downloads/Impact_Report_Issue_7.pdf"),
    EditionSpec(issue=6,  fiscal_year="FY2012/13", published="2014-06-30",
                url="https://wasreb.go.ke/downloads/Impact_Report_Issue_6.pdf"),
    EditionSpec(issue=5,  fiscal_year="FY2011/12", published="2013-06-30",
                url="https://wasreb.go.ke/downloads/Impact_Report_Issue_5.pdf"),
    EditionSpec(issue=4,  fiscal_year="FY2010/11", published="2012-06-30",
                url="https://wasreb.go.ke/downloads/Impact_Report_Issue_4.pdf"),
    EditionSpec(issue=3,  fiscal_year="FY2009/10", published="2011-06-30",
                url="https://wasreb.go.ke/downloads/Impact_Report_Issue_3.pdf"),
    EditionSpec(issue=2,  fiscal_year="FY2008/09", published="2010-06-30",
                url="https://wasreb.go.ke/downloads/Impact_Report_Issue_2.pdf"),
    EditionSpec(issue=1,  fiscal_year="FY2007/08", published="2009-06-30",
                url="https://wasreb.go.ke/downloads/Impact_Report_Issue_1.pdf"),
)


EDITIONS_BY_ISSUE: Final[dict[int, EditionSpec]] = {e.issue: e for e in EDITIONS}


def edition(issue: int) -> EditionSpec:
    try:
        return EDITIONS_BY_ISSUE[issue]
    except KeyError:
        raise KeyError(f"no WASREB IMPACT edition #{issue} in the registry") from None
